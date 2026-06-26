package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"github.com/kardianos/service"
	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
)

const (
	AGENT_VERSION = "go-1.0.0"
	SYNC_INTERVAL = 1 * time.Hour
)

// -- Configuración Local --
type Config struct {
	ServerURL string `json:"serverUrl"`
	ApiKey    string `json:"apiKey"`
}

func getConfigPath() string {
	exePath, _ := os.Executable()
	return filepath.Join(filepath.Dir(exePath), "config.json")
}

func loadConfig() (*Config, error) {
	file, err := os.ReadFile(getConfigPath())
	if err != nil {
		return nil, err
	}
	var cfg Config
	err = json.Unmarshal(file, &cfg)
	return &cfg, err
}

func saveConfig(cfg *Config) error {
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(getConfigPath(), data, 0644)
}

// -- Estructura de Datos --
type AgentPayload struct {
	Hostname       string `json:"hostname"`
	MacAddress     string `json:"macAddress"`
	IPAddress      string `json:"ipAddress"`
	OS             string `json:"os"`
	SerialNumber   string `json:"serialNumber"`
	// Fabricante y modelo
	Manufacturer   string `json:"manufacturer"`
	Model          string `json:"model"`
	BiosVersion    string `json:"biosVersion"`
	// CPU
	CPUModel       string `json:"cpuModel"`
	CPUCores       int    `json:"cpuCores"`
	// RAM
	RAMTotalBytes  uint64 `json:"ramTotalBytes"`
	RAMType        string `json:"ramType"`
	RAMSlots       int    `json:"ramSlots"`
	RAMSlotsUsed   int    `json:"ramSlotsUsed"`
	RAMSpeed       string `json:"ramSpeed"`
	// Disco
	DiskTotalBytes uint64 `json:"diskTotalBytes"`
	DiskUsedBytes  uint64 `json:"diskUsedBytes"`
	DiskFreeBytes  uint64 `json:"diskFreeBytes"`
	DiskType       string `json:"diskType"`
	Volumes        string `json:"volumes"`
	// Red y dominio
	Domain         string `json:"domain"`
	LoggedUser     string `json:"loggedUser"`
	// Versión del agente
	AgentVersion   string `json:"agentVersion"`
	// Tiempos
	LastBoot       string `json:"lastBoot"`
}

func getMacAddress() string {
	interfaces, err := net.Interfaces()
	if err == nil {
		for _, i := range interfaces {
			if i.Flags&net.FlagUp != 0 && bytes.Compare(i.HardwareAddr, nil) != 0 {
				return i.HardwareAddr.String()
			}
		}
	}
	return "UNKNOWN_MAC"
}

func getLocalIP() string {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return ""
	}
	for _, address := range addrs {
		if ipnet, ok := address.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				return ipnet.IP.String()
			}
		}
	}
	return ""
}

func getManufacturer() string {
	if runtime.GOOS == "windows" {
		out, err := exec.Command("powershell", "-NoProfile", "-Command",
			"Get-CimInstance Win32_ComputerSystem | Select-Object -ExpandProperty Manufacturer").Output()
		if err == nil {
			s := string(bytes.TrimSpace(out))
			if s != "" && s != "Unknown" { return s }
		}
		return ""
	}
	b, err := os.ReadFile("/sys/class/dmi/id/sys_vendor")
	if err == nil { return string(bytes.TrimSpace(b)) }
	return ""
}

func getModel() string {
	if runtime.GOOS == "windows" {
		out, err := exec.Command("powershell", "-NoProfile", "-Command",
			"Get-CimInstance Win32_ComputerSystem | Select-Object -ExpandProperty Model").Output()
		if err == nil {
			s := string(bytes.TrimSpace(out))
			if s != "" && s != "Unknown" { return s }
		}
		return ""
	}
	b, err := os.ReadFile("/sys/class/dmi/id/product_name")
	if err == nil { return string(bytes.TrimSpace(b)) }
	return ""
}

func getBiosVersion() string {
	if runtime.GOOS == "windows" {
		out, err := exec.Command("powershell", "-NoProfile", "-Command",
			"Get-CimInstance Win32_BIOS | Select-Object -ExpandProperty SMBIOSBIOSVersion").Output()
		if err == nil {
			s := string(bytes.TrimSpace(out))
			if s != "" { return s }
		}
		return ""
	}
	b, err := os.ReadFile("/sys/class/dmi/id/bios_version")
	if err == nil { return string(bytes.TrimSpace(b)) }
	return ""
}

func getDomain() string {
	if runtime.GOOS == "windows" {
		out, err := exec.Command("powershell", "-NoProfile", "-Command",
			"Get-CimInstance Win32_ComputerSystem | Select-Object -ExpandProperty Domain").Output()
		if err == nil {
			s := string(bytes.TrimSpace(out))
			if s != "" { return s }
		}
		return ""
	}
	out, err := exec.Command("dnsdomainname").Output()
	if err == nil {
		s := string(bytes.TrimSpace(out))
		if s != "" { return s }
	}
	return ""
}

type VolumeInfo struct {
	DeviceID     string `json:"deviceId"`
	Label        string `json:"label"`
	FileSystem   string `json:"fileSystem"`
	TotalBytes   uint64 `json:"totalBytes"`
	UsedBytes    uint64 `json:"usedBytes"`
	FreeBytes    uint64 `json:"freeBytes"`
}

func getVolumes() string {
	partitions, err := disk.Partitions(false)
	if err != nil || len(partitions) == 0 {
		return ""
	}
	var volumes []VolumeInfo
	for _, p := range partitions {
		usage, err := disk.Usage(p.Mountpoint)
		if err != nil {
			continue
		}
		volumes = append(volumes, VolumeInfo{
			DeviceID:   p.Device,
			Label:      p.Device, // gopsutil no expone VolumeName directamente
			FileSystem: p.Fstype,
			TotalBytes: usage.Total,
			UsedBytes:  usage.Used,
			FreeBytes:  usage.Free,
		})
	}
	if len(volumes) == 0 {
		return ""
	}
	data, err := json.Marshal(volumes)
	if err != nil {
		return ""
	}
	return string(data)
}

func getDiskType() string {
	if runtime.GOOS == "windows" {
		out, err := exec.Command("powershell", "-NoProfile", "-Command",
			"$d=Get-CimInstance Win32_DiskDrive | Select-Object -First 1; $desc=(\"$($d.Model) $($d.Caption) $($d.InterfaceType)\").ToLower(); if($desc -match 'nvme' -or $desc -match 'm\\.2'){'NVMe'} elseif($desc -match 'ssd' -or $desc -match 'solid.state'){'SSD'} elseif($d.MediaType -eq 12 -or $d.MediaType -eq 11){'SSD'} else{'HDD'}").Output()
		if err == nil {
			s := string(bytes.TrimSpace(out))
			if s != "" {
				return s
			}
		}
		return ""
	}
	// En Linux: revisar /sys/block/<device>/queue/rotational
	out, err := exec.Command("sh", "-c", `lsblk -d -o name,rota 2>/dev/null | grep -v NAME | head -1 | awk '{if($2==0)print"SSD";else print"HDD"}'`).Output()
	if err == nil {
		s := string(bytes.TrimSpace(out))
		if s != "" {
			return s
		}
	}
	return ""
}

func getRamType() string {
	if runtime.GOOS == "windows" {
		out, err := exec.Command("powershell", "-NoProfile", "-Command",
			"$m=Get-CimInstance Win32_PhysicalMemory | Select-Object -First 1; if(-not $m){'';exit}; switch($m.SMBIOSMemoryType){20{'DDR'}21{'DDR2'}24{'DDR3'}26{'DDR4'}27{'DDR5'}30{'LPDDR'}31{'LPDDR2'}32{'LPDDR3'}34{'LPDDR5'}default{\"Tipo $($m.SMBIOSMemoryType)\"}}").Output()
		if err == nil {
			return string(bytes.TrimSpace(out))
		}
		return ""
	}
	return ""
}

func getRamSlotsTotal() int {
	if runtime.GOOS == "windows" {
		out, err := exec.Command("powershell", "-NoProfile", "-Command",
			"@(Get-CimInstance Win32_PhysicalMemory).Count").Output()
		if err == nil {
			n := 0
			fmt.Sscanf(string(bytes.TrimSpace(out)), "%d", &n)
			return n
		}
		return 0
	}
	return 0
}

func getRamSlotsUsed() int {
	if runtime.GOOS == "windows" {
		out, err := exec.Command("powershell", "-NoProfile", "-Command",
			`@(Get-CimInstance Win32_PhysicalMemory | Where-Object { $_.Capacity -gt 0 }).Count`).Output()
		if err == nil {
			n := 0
			fmt.Sscanf(string(bytes.TrimSpace(out)), "%d", &n)
			return n
		}
		return 0
	}
	return 0
}

func getRamSpeed() string {
	if runtime.GOOS == "windows" {
		out, err := exec.Command("powershell", "-NoProfile", "-Command",
			"$m=Get-CimInstance Win32_PhysicalMemory | Select-Object -First 1; if($m){\"$($m.Speed) MHz\"}else{''}").Output()
		if err == nil {
			return string(bytes.TrimSpace(out))
		}
		return ""
	}
	return ""
}

func getLoggedUser() string {
	if runtime.GOOS == "windows" {
		out, err := exec.Command("powershell", "-NoProfile", "-Command",
			"Get-CimInstance Win32_ComputerSystem | Select-Object -ExpandProperty UserName").Output()
		if err == nil {
			s := string(bytes.TrimSpace(out))
			if s != "" { return s }
		}
		return ""
	}
	out, err := exec.Command("who", "-m").Output()
	if err == nil { return string(bytes.TrimSpace(out)) }
	return ""
}

func getSerialNumber() string {
	if runtime.GOOS == "windows" {
		// Use WMI via PowerShell to get the BIOS serial number
		cmd := exec.Command("powershell", "-NoProfile", "-Command", 
			"Get-CimInstance Win32_BIOS | Select-Object -ExpandProperty SerialNumber")
		out, err := cmd.Output()
		if err == nil {
			s := string(bytes.TrimSpace(out))
			if s != "" && s != "To be filled by O.E.M." && s != "Default string" && s != "00000000-0000-0000-0000-000000000000" {
				return s
			}
		}
		return ""
	}
	paths := []string{
		"/sys/class/dmi/id/product_serial",
		"/sys/class/dmi/id/chassis_serial",
	}
	for _, p := range paths {
		b, err := os.ReadFile(p)
		if err == nil {
			s := string(bytes.TrimSpace(b))
			if s != "" && s != "00000000-0000-0000-0000-000000000000" {
				return s
			}
		}
	}
	return "UNKNOWN_SERIAL"
}

func collectHardwareData() *AgentPayload {
	hostStat, _ := host.Info()
	memStat, _ := mem.VirtualMemory()
	cpuStats, _ := cpu.Info()
	cpuModel := "Unknown"
	cpuCores := 0
	if len(cpuStats) > 0 {
		cpuModel = cpuStats[0].ModelName
		cpuCores = int(cpuStats[0].Cores)
	}
	path := "/"
	if runtime.GOOS == "windows" {
		path = "C:\\"
	}
	diskStat, _ := disk.Usage(path)

	// Calcular lastBoot desde host.Info()
	lastBoot := ""
	if hostStat.BootTime > 0 {
		lastBoot = time.Unix(int64(hostStat.BootTime), 0).UTC().Format("2006-01-02T15:04:05Z")
	}

	return &AgentPayload{
		Hostname:       hostStat.Hostname,
		OS:             fmt.Sprintf("%s %s", hostStat.Platform, hostStat.PlatformVersion),
		SerialNumber:   getSerialNumber(),
		Manufacturer:   getManufacturer(),
		Model:          getModel(),
		BiosVersion:    getBiosVersion(),
		Domain:         getDomain(),
		LoggedUser:     getLoggedUser(),
		MacAddress:     getMacAddress(),
		IPAddress:      getLocalIP(),
		CPUModel:       cpuModel,
		CPUCores:       cpuCores,
		// RAM
		RAMTotalBytes:  memStat.Total,
		RAMType:        getRamType(),
		RAMSlots:       getRamSlotsTotal(),
		RAMSlotsUsed:   getRamSlotsUsed(),
		RAMSpeed:       getRamSpeed(),
		// Disco
		DiskTotalBytes: diskStat.Total,
		DiskUsedBytes:  diskStat.Used,
		DiskFreeBytes:  diskStat.Free,
		DiskType:       getDiskType(),
		Volumes:        getVolumes(),
		// Red y dominio
		AgentVersion:   AGENT_VERSION,
		LastBoot:       lastBoot,
	}
}

// Normaliza la URL del servidor:
// - Si no tiene esquema (http:// o https://), agrega http://
// - Si tiene puerto pero no esquema, agrega http:// (ej: 192.168.1.100:3001 → http://192.168.1.100:3001)
// - Si tiene dominio sin esquema (ej: servidor.egan.local), agrega http://
func normalizeServerURL(raw string) string {
	if raw == "" {
		return raw
	}
	// Si ya tiene esquema, devolver tal cual
	if strings.HasPrefix(raw, "http://") || strings.HasPrefix(raw, "https://") {
		return strings.TrimRight(raw, "/")
	}
	// Agregar http:// por defecto
	return "http://" + strings.TrimRight(raw, "/")
}

func sendData(cfg *Config, payload *AgentPayload) {
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return
	}
	
	endpoint := cfg.ServerURL
	if !strings.HasSuffix(endpoint, "/") {
		endpoint += "/"
	}
	endpoint += "api/discovery/agent"

	req, err := http.NewRequest("POST", endpoint, bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("Fallo creando request: %v", err)
		return
	}
	req.Header.Set("Content-Type", "application/json")
	// Enviar API Key si está configurada
	if cfg.ApiKey != "" {
		req.Header.Set("X-API-Key", cfg.ApiKey)
		log.Printf("Usando API Key para autenticación")
	}

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Fallo conectando a %s: %v", endpoint, err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == 200 || resp.StatusCode == 201 {
		log.Printf("Reporte enviado exitosamente a %s", endpoint)
	} else if resp.StatusCode == 401 {
		log.Printf("Error de autenticación (401): API Key inválida. Configúrala desde el panel /admin")
	} else {
		log.Printf("Respuesta inesperada del servidor: %d", resp.StatusCode)
	}
}

// -- Servicio --
type program struct {
	exit chan struct{}
}

func (p *program) Start(s service.Service) error {
	p.exit = make(chan struct{})
	go p.run()
	return nil
}

func (p *program) run() {
	cfg, err := loadConfig()
	if err != nil {
		log.Printf("Error leyendo config.json: %v", err)
		return
	}

	ticker := time.NewTicker(SYNC_INTERVAL)
	
	// Enviar reporte inicial apenas arranca el servicio
	sendData(cfg, collectHardwareData())

	for {
		select {
		case <-ticker.C:
			sendData(cfg, collectHardwareData())
		case <-p.exit:
			ticker.Stop()
			return
		}
	}
}

func (p *program) Stop(s service.Service) error {
	close(p.exit)
	return nil
}

func main() {
	// Flags de consola para la instalación
	installFlag := flag.Bool("install", false, "Instalar como servicio")
	uninstallFlag := flag.Bool("uninstall", false, "Desinstalar el servicio")
	startFlag := flag.Bool("start", false, "Iniciar el servicio")
	stopFlag := flag.Bool("stop", false, "Detener el servicio")
	serverURL := flag.String("server", "", "URL, IP o dominio del servidor (Ej: http://192.168.1.100:3001 o solo 192.168.1.100:3001 o server.egan.local)")
	serverHost := flag.String("host", "", "Alias de -server: IP o dominio del servidor (Ej: 192.168.1.100:3001)")
	apiKey := flag.String("api-key", "", "API Key para autenticación con el servidor")
	runOnceFlag := flag.Bool("once", false, "Ejecutar una sola vez y salir (sin instalar servicio)")
	flag.Parse()

	// Si se usó -host como alias de -server
	finalURL := *serverURL
	if finalURL == "" && *serverHost != "" {
		finalURL = *serverHost
	}

	// Modo ejecución única (sin servicio)
	if *runOnceFlag {
		if finalURL == "" {
			log.Fatal("Error: Debes proporcionar la IP/dominio del servidor. Ejemplo: --host 192.168.1.100:3001 --once")
		}
		normalized := normalizeServerURL(finalURL)
		log.Printf("Enviando reporte a: %s", normalized)
		sendData(&Config{ServerURL: normalized}, collectHardwareData())
		return
	}

	// Banner de ayuda
	flag.Usage = func() {
		fmt.Fprintf(os.Stderr, "TecMan Discovery Agent - Reporte automático de hardware\n\n")
		fmt.Fprintf(os.Stderr, "USO:\n")
		fmt.Fprintf(os.Stderr, "  tecman-discovery.exe --server <ip:puerto> --install   Instalar como servicio\n")
		fmt.Fprintf(os.Stderr, "  tecman-discovery.exe --host <ip:puerto> --once       Ejecutar una vez\n")
		fmt.Fprintf(os.Stderr, "  tecman-discovery.exe --uninstall                    Desinstalar servicio\n\n")
		fmt.Fprintf(os.Stderr, "OPCIONES:\n")
		flag.PrintDefaults()
		fmt.Fprintf(os.Stderr, "\n")
		fmt.Fprintf(os.Stderr, "EJEMPLOS:\n")
		fmt.Fprintf(os.Stderr, "  tecman-discovery.exe --server 192.168.1.100:3001 --install\n")
		fmt.Fprintf(os.Stderr, "  tecman-discovery.exe --host servidor.egan.local --once\n")
		fmt.Fprintf(os.Stderr, "  tecman-discovery.exe -s http://tecmanserver.internal:3001 -i\n")
	}

	svcConfig := &service.Config{
		Name:        "TecManAgent",
		DisplayName: "TecMan Discovery Agent",
		Description: "Agente que reporta el estado del hardware al servidor de TecMan CMMS/ITSM.",
	}

	prg := &program{}
	s, err := service.New(prg, svcConfig)
	if err != nil {
		log.Fatal(err)
	}

	// Manejo de comandos de instalación
	if *installFlag {
		if finalURL == "" {
			log.Fatal("Error: Debes proporcionar la IP/dominio del servidor.\n\nEjemplos:\n  tecman-discovery.exe --server 192.168.1.100:3001 --install\n  tecman-discovery.exe --host servidor.egan.local --install")
		}
		normalized := normalizeServerURL(finalURL)
		log.Printf("Servidor configurado: %s", normalized)
		if *apiKey != "" {
			log.Printf("API Key configurada")
		}
		saveConfig(&Config{ServerURL: normalized, ApiKey: *apiKey})
		err = s.Install()
		if err != nil {
			log.Fatalf("Error instalando el servicio: %v", err)
		}
		log.Println("Servicio instalado exitosamente.")
		log.Println("Para iniciar: tecman-discovery.exe --start")
		return
	}

	if *uninstallFlag {
		err = s.Uninstall()
		if err != nil {
			log.Fatalf("Error desinstalando: %v", err)
		}
		log.Println("Servicio desinstalado.")
		return
	}

	if *startFlag {
		err = s.Start()
		if err != nil {
			log.Fatal(err)
		}
		return
	}

	if *stopFlag {
		err = s.Stop()
		if err != nil {
			log.Fatal(err)
		}
		return
	}

	// Default: ejecutar como servicio continuo
	// (el gestor de servicios invoca el binario sin flags después de --install)
	err = s.Run()
	if err != nil {
		log.Fatal(err)
	}
}
