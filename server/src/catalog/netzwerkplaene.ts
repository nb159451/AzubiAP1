/**
 * Netzwerkplan-Aufgaben: Ein vorgegebener Netzwerkplan muss um Geräte,
 * Verbindungen und Adressen ergänzt werden.
 */
import type { Question } from '../../../shared/types.js';

export const questions: Question[] = [
  {
    id: 'nw-nd-001',
    section: 'netzwerk',
    topic: 'netzwerkplanung',
    type: 'network_diagram',
    title: 'Büronetz absichern und erweitern',
    scenario:
      'Die Werbeagentur PixelPark GmbH hat ein kleines Büronetz: Ein Router verbindet das Netz direkt mit dem Internet, an einem Switch hängen zwei PCs und ein Netzwerkdrucker. Die Geschäftsführung wünscht eine dedizierte Firewall und WLAN für Besucher-Notebooks.',
    text:
      'Ergänzen Sie den Netzwerkplan:\n\na) Platzieren Sie eine **Firewall** so, dass der gesamte Internetverkehr sie passieren muss (zwischen Internet und Router). Die direkte Verbindung Internet–Router darf danach nicht mehr bestehen.\nb) Ergänzen Sie einen **Access Point**, der am Switch angeschlossen wird.\nc) Vergeben Sie für PC 1 und PC 2 jeweils eine gültige, eindeutige Host-Adresse im Netz **192.168.1.0/24**. Der Router hat die Adresse 192.168.1.1.\n\nBedienung: Geräte über die Schaltflächen hinzufügen, per Maus verschieben; im Modus „Verbinden“ nacheinander zwei Geräte anklicken. Gestrichelte Verbindungen können durch Anklicken entfernt werden.',
    points: 6,
    difficulty: 2,
    canvas: { width: 760, height: 420 },
    devices: [
      { id: 'internet', type: 'internet', label: 'Internet', x: 90, y: 90, fixed: true },
      { id: 'router', type: 'router', label: 'Router', x: 380, y: 90, fixed: true, ip: '192.168.1.1' },
      { id: 'switch', type: 'switch', label: 'Switch', x: 380, y: 220, fixed: true },
      { id: 'pc1', type: 'pc', label: 'PC 1', x: 180, y: 340, fixed: true, ipField: { placeholder: 'IP-Adresse' } },
      { id: 'pc2', type: 'pc', label: 'PC 2', x: 380, y: 340, fixed: true, ipField: { placeholder: 'IP-Adresse' } },
      { id: 'printer', type: 'printer', label: 'Drucker', x: 580, y: 340, fixed: true, ip: '192.168.1.50' },
    ],
    links: [
      { a: 'internet', b: 'router' },
      { a: 'router', b: 'switch', fixed: true },
      { a: 'switch', b: 'pc1', fixed: true },
      { a: 'switch', b: 'pc2', fixed: true },
      { a: 'switch', b: 'printer', fixed: true },
    ],
    palette: ['firewall', 'access_point', 'switch', 'server'],
    rules: [
      { points: 1, description: 'Firewall vorhanden', rule: { kind: 'device_exists', type: 'firewall', min: 1 } },
      { points: 1, description: 'Firewall ist mit dem Internet verbunden', rule: { kind: 'link_exists', a: { id: 'internet' }, b: { type: 'firewall' } } },
      { points: 1, description: 'Firewall ist mit dem Router verbunden', rule: { kind: 'link_exists', a: { type: 'firewall' }, b: { id: 'router' } } },
      { points: 1, description: 'Keine direkte Verbindung Internet–Router mehr', rule: { kind: 'link_absent', a: { id: 'internet' }, b: { id: 'router' } } },
      { points: 1, description: 'Access Point vorhanden und am Switch angeschlossen', rule: { kind: 'link_exists', a: { type: 'access_point' }, b: { id: 'switch' } } },
      { points: 0.5, description: 'PC 1: gültige Host-Adresse in 192.168.1.0/24 (nicht .1, nicht .50)', rule: { kind: 'ip', deviceId: 'pc1', inSubnet: '192.168.1.0/24', exclude: ['192.168.1.1', '192.168.1.50'], uniqueAmong: ['pc1', 'pc2'] } },
      { points: 0.5, description: 'PC 2: gültige, eindeutige Host-Adresse in 192.168.1.0/24', rule: { kind: 'ip', deviceId: 'pc2', inSubnet: '192.168.1.0/24', exclude: ['192.168.1.1', '192.168.1.50'], uniqueAmong: ['pc1', 'pc2'] } },
    ],
    solution:
      'Internet – Firewall – Router – Switch; Access Point am Switch. PC 1 z. B. 192.168.1.10, PC 2 z. B. 192.168.1.11 (jede Adresse von .2 bis .254 außer .1 und .50, beide unterschiedlich).',
    explanation:
      'Die Firewall muss im Pfad zwischen Internet und internem Netz liegen, sonst kann Verkehr an ihr vorbeilaufen. Host-Adressen dürfen weder Netz- (.0) noch Broadcastadresse (.255) sein und müssen eindeutig sein.',
  },
  {
    id: 'nw-nd-002',
    section: 'netzwerk',
    topic: 'dmz',
    type: 'network_diagram',
    title: 'Webserver in einer DMZ platzieren',
    scenario:
      'Die Sportartikel-Händlerin Lauffreude e. K. möchte ihren Webshop auf einem eigenen Server betreiben. Die Firewall des Unternehmens besitzt drei Schnittstellen: WAN (Internet), LAN (192.168.50.1) und DMZ (172.16.10.1/24). Im LAN hängen ein Switch mit Arbeitsplätzen und ein NAS als Dateiablage.',
    text:
      'Ergänzen Sie den Netzwerkplan:\n\na) Fügen Sie den **Webserver** hinzu und schließen Sie ihn direkt an die Firewall (DMZ-Schnittstelle) an. Er darf **nicht** mit dem LAN-Switch verbunden sein, damit ein kompromittierter Webserver keinen Zugriff auf das interne Netz hat.\nb) Die Verwaltung benötigt einen **Netzwerkdrucker** im LAN. Fügen Sie ihn hinzu und verbinden Sie ihn mit dem LAN-Switch.',
    points: 6,
    difficulty: 2,
    canvas: { width: 760, height: 420 },
    devices: [
      { id: 'internet', type: 'internet', label: 'Internet', x: 90, y: 90, fixed: true },
      { id: 'fw', type: 'firewall', label: 'Firewall', x: 340, y: 90, fixed: true, ip: 'LAN .50.1 · DMZ 172.16.10.1' },
      { id: 'switch', type: 'switch', label: 'LAN-Switch', x: 340, y: 240, fixed: true },
      { id: 'pc1', type: 'pc', label: 'Arbeitsplatz 1', x: 200, y: 350, fixed: true, ip: '192.168.50.20' },
      { id: 'pc2', type: 'pc', label: 'Arbeitsplatz 2', x: 340, y: 350, fixed: true, ip: '192.168.50.21' },
      { id: 'file', type: 'nas', label: 'NAS', x: 480, y: 350, fixed: true, ip: '192.168.50.10' },
    ],
    links: [
      { a: 'internet', b: 'fw', fixed: true },
      { a: 'fw', b: 'switch', fixed: true, label: 'LAN' },
      { a: 'switch', b: 'pc1', fixed: true },
      { a: 'switch', b: 'pc2', fixed: true },
      { a: 'switch', b: 'file', fixed: true },
    ],
    palette: ['server', 'printer', 'switch', 'router'],
    rules: [
      { points: 1, description: 'Webserver (Server) vorhanden', rule: { kind: 'device_exists', type: 'server', min: 1 } },
      { points: 1.5, description: 'Webserver direkt mit der Firewall verbunden (DMZ-Schnittstelle)', rule: { kind: 'link_exists', a: { type: 'server' }, b: { id: 'fw' } } },
      { points: 1.5, description: 'Webserver nicht mit dem LAN-Switch verbunden (DMZ vom LAN getrennt)', rule: { kind: 'link_absent', a: { type: 'server' }, b: { id: 'switch' } } },
      { points: 1, description: 'Netzwerkdrucker vorhanden', rule: { kind: 'device_exists', type: 'printer', min: 1 } },
      { points: 1, description: 'Netzwerkdrucker am LAN-Switch angeschlossen', rule: { kind: 'link_exists', a: { type: 'printer' }, b: { id: 'switch' } } },
    ],
    solution:
      'Webserver an die DMZ-Schnittstelle der Firewall (Adresse aus 172.16.10.0/24, z. B. 172.16.10.10), keine Verbindung zum LAN-Switch. Drucker an den LAN-Switch.',
    explanation:
      'Eine DMZ (demilitarisierte Zone) ist ein eigenes Netzsegment an der Firewall. Von außen erreichbare Dienste werden dort platziert; die Firewall regelt, dass aus der DMZ kein direkter Zugriff auf das LAN möglich ist.',
  },
  {
    id: 'nw-nd-003',
    section: 'netzwerk',
    topic: 'standortvernetzung',
    type: 'network_diagram',
    title: 'Filiale per VPN anbinden',
    scenario:
      'Die Bäckereikette Kornblume eröffnet eine Filiale. Die Zentrale ist über eine Firewall mit dem Internet verbunden und betreibt einen Kassenserver. In der Filiale sind ein Switch und zwei Kassen-PCs (192.168.20.10 und 192.168.20.11, Subnetzmaske 255.255.255.0) bereits vorhanden – aber noch nicht an das Internet und die Zentrale angebunden.',
    text:
      'Ergänzen Sie den Netzwerkplan der Filiale:\n\na) Fügen Sie einen **Router** (VPN-fähig) hinzu, der die Filiale mit dem Internet verbindet: Verbindung Router–Internet und Router–Filial-Switch.\nb) Der Filial-Switch darf weder eine direkte Verbindung zum Internet noch eine direkte Kabelverbindung zur Zentrale erhalten – die Kopplung erfolgt ausschließlich über den VPN-Tunnel des Routers.',
    points: 6,
    difficulty: 2,
    canvas: { width: 800, height: 420 },
    devices: [
      { id: 'internet', type: 'internet', label: 'Internet', x: 400, y: 70, fixed: true },
      { id: 'fw', type: 'firewall', label: 'Firewall Zentrale', x: 150, y: 170, fixed: true, ip: 'LAN 192.168.10.1' },
      { id: 'sw-z', type: 'switch', label: 'Switch Zentrale', x: 150, y: 290, fixed: true },
      { id: 'srv', type: 'server', label: 'Kassenserver', x: 150, y: 380, fixed: true, ip: '192.168.10.5' },
      { id: 'sw-f', type: 'switch', label: 'Switch Filiale', x: 650, y: 290, fixed: true },
      { id: 'k1', type: 'pc', label: 'Kasse 1', x: 560, y: 380, fixed: true, ip: '192.168.20.10' },
      { id: 'k2', type: 'pc', label: 'Kasse 2', x: 740, y: 380, fixed: true, ip: '192.168.20.11' },
    ],
    links: [
      { a: 'internet', b: 'fw', fixed: true },
      { a: 'fw', b: 'sw-z', fixed: true },
      { a: 'sw-z', b: 'srv', fixed: true },
      { a: 'sw-f', b: 'k1', fixed: true },
      { a: 'sw-f', b: 'k2', fixed: true },
    ],
    palette: ['router', 'firewall', 'switch', 'access_point'],
    rules: [
      { points: 1, description: 'Router in der Filiale vorhanden', rule: { kind: 'device_exists', type: 'router', min: 1 } },
      { points: 1.5, description: 'Router ist mit dem Internet verbunden', rule: { kind: 'link_exists', a: { type: 'router' }, b: { id: 'internet' } } },
      { points: 1.5, description: 'Router ist mit dem Filial-Switch verbunden', rule: { kind: 'link_exists', a: { type: 'router' }, b: { id: 'sw-f' } } },
      { points: 1, description: 'Filial-Switch hat keine direkte Internetverbindung', rule: { kind: 'link_absent', a: { id: 'sw-f' }, b: { id: 'internet' } } },
      { points: 1, description: 'Zentrale nicht direkt mit dem Filial-Switch verkabelt (Anbindung nur über Internet/VPN)', rule: { kind: 'link_absent', a: { id: 'sw-f' }, b: { id: 'sw-z' } } },
    ],
    solution:
      'Internet – Router (Filiale) – Switch Filiale. Der Router erhält im LAN die erste nutzbare Adresse 192.168.20.1 und baut einen VPN-Tunnel zur Firewall der Zentrale auf. Der Switch selbst hat keine WAN-Anbindung.',
    explanation:
      'Ein Site-to-Site-VPN verbindet zwei Standorte verschlüsselt über das öffentliche Internet. Endpunkte sind der Filialrouter und die Firewall der Zentrale; die erste nutzbare Host-Adresse von 192.168.20.0/24 ist 192.168.20.1.',
  },
  {
    id: 'nw-nd-004',
    section: 'netzwerk',
    topic: 'netzwerkplanung',
    type: 'network_diagram',
    title: 'Netz einer Arztpraxis erweitern',
    scenario:
      'Die Gemeinschaftspraxis Dr. Keller & Dr. Yilmaz nutzt einen DSL-Router (192.168.178.1) mit Internetzugang und einen Switch, an dem drei Praxis-PCs (192.168.178.20, .21, .22) hängen. Gewünscht sind ein WLAN für Tablets im Wartezimmer, ein Netzwerkdrucker und ein NAS für die Datensicherung.',
    text:
      'Ergänzen Sie den Netzwerkplan:\n\na) Fügen Sie einen **Access Point** hinzu und verbinden Sie ihn mit dem Switch.\nb) Fügen Sie einen **Netzwerkdrucker** hinzu, verbinden Sie ihn mit dem Switch und weisen Sie ihm eine feste, gültige und noch unbenutzte Host-Adresse im Netz **192.168.178.0/24** zu (Adressfeld am Gerät).\nc) Fügen Sie ein **NAS** hinzu und verbinden Sie es mit dem Switch.',
    points: 6,
    difficulty: 1,
    canvas: { width: 760, height: 420 },
    devices: [
      { id: 'internet', type: 'internet', label: 'Internet', x: 90, y: 90, fixed: true },
      { id: 'router', type: 'router', label: 'DSL-Router', x: 380, y: 90, fixed: true, ip: '192.168.178.1' },
      { id: 'switch', type: 'switch', label: 'Switch', x: 380, y: 220, fixed: true },
      { id: 'pc1', type: 'pc', label: 'Empfang', x: 160, y: 340, fixed: true, ip: '192.168.178.20' },
      { id: 'pc2', type: 'pc', label: 'Sprechzimmer 1', x: 300, y: 340, fixed: true, ip: '192.168.178.21' },
      { id: 'pc3', type: 'pc', label: 'Sprechzimmer 2', x: 440, y: 340, fixed: true, ip: '192.168.178.22' },
      { id: 'printer', type: 'printer', label: 'Drucker', x: 640, y: 340, fixed: true, ipField: { placeholder: 'feste IP' } },
    ],
    links: [
      { a: 'internet', b: 'router', fixed: true },
      { a: 'router', b: 'switch', fixed: true },
      { a: 'switch', b: 'pc1', fixed: true },
      { a: 'switch', b: 'pc2', fixed: true },
      { a: 'switch', b: 'pc3', fixed: true },
    ],
    palette: ['access_point', 'nas', 'switch', 'server'],
    rules: [
      { points: 1, description: 'Access Point vorhanden', rule: { kind: 'device_exists', type: 'access_point', min: 1 } },
      { points: 1, description: 'Access Point am Switch angeschlossen', rule: { kind: 'link_exists', a: { type: 'access_point' }, b: { id: 'switch' } } },
      { points: 1, description: 'Drucker mit dem Switch verbunden', rule: { kind: 'link_exists', a: { id: 'printer' }, b: { id: 'switch' } } },
      { points: 1.5, description: 'Drucker: gültige, unbenutzte Host-Adresse in 192.168.178.0/24', rule: { kind: 'ip', deviceId: 'printer', inSubnet: '192.168.178.0/24', exclude: ['192.168.178.1', '192.168.178.20', '192.168.178.21', '192.168.178.22'] } },
      { points: 0.5, description: 'NAS vorhanden', rule: { kind: 'device_exists', type: 'nas', min: 1 } },
      { points: 1, description: 'NAS am Switch angeschlossen', rule: { kind: 'link_exists', a: { type: 'nas' }, b: { id: 'switch' } } },
    ],
    solution:
      'Access Point, Drucker und NAS jeweils an den Switch. Drucker z. B. 192.168.178.30 (jede Adresse .2–.254 außer .1, .20, .21, .22).',
    explanation:
      'Netzwerkdrucker erhalten üblicherweise eine feste Adresse außerhalb des DHCP-Bereichs, damit die Druckerfreigabe stabil bleibt. Alle Geräte eines kleinen Praxisnetzes hängen sternförmig am Switch.',
  },
];
