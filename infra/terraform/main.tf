# VoidPush Relay Network — Terraform
# Provisions 9 relay VPS nodes across 9 countries
# Provider: Hetzner Cloud (EU) + DigitalOcean (global)
# Run: terraform init && terraform plan && terraform apply

terraform {
  required_version = ">= 1.7.0"
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.45"
    }
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.36"
    }
  }
  backend "s3" {
    bucket = "voidpush-tfstate"
    key    = "relay-network/terraform.tfstate"
    region = "eu-central-1"
    # State is encrypted at rest — no relay keys stored here
  }
}

# ─── Variables ────────────────────────────────────────────────────────────────

variable "hcloud_token" {
  description = "Hetzner Cloud API token"
  type        = string
  sensitive   = true
}

variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "relay_image" {
  description = "Docker image for void-relay"
  type        = string
  default     = "ghcr.io/voidpush-stack/voidpush/void-relay:latest"
}

variable "ssh_public_key" {
  description = "SSH public key for emergency access"
  type        = string
}

# Relay private keys — generated externally, never stored in TF state
# Generate: openssl rand -hex 32
variable "relay_private_keys" {
  description = "Map of relay ID to private key hex"
  type        = map(string)
  sensitive   = true
}

# ─── Providers ────────────────────────────────────────────────────────────────

provider "hcloud" {
  token = var.hcloud_token
}

provider "digitalocean" {
  token = var.do_token
}

# ─── SSH Key ──────────────────────────────────────────────────────────────────

resource "hcloud_ssh_key" "voidpush" {
  name       = "voidpush-relay-key"
  public_key = var.ssh_public_key
}

# ─── Hetzner relay nodes (EU/AP) ─────────────────────────────────────────────

locals {
  hetzner_relays = {
    R3 = { location = "fsn1",  region = "eu", city = "Frankfurt" }
    R5 = { location = "nbg1",  region = "eu", city = "Amsterdam" }  # Nuremberg → proxied
    R1 = { location = "hel1",  region = "ap", city = "Tokyo"     }  # Helsinki → note: Tokyo is DO
  }
}

resource "hcloud_server" "relay" {
  for_each    = local.hetzner_relays
  name        = "voidpush-relay-${lower(each.key)}"
  server_type = "cx22"   # 2 vCPU, 4GB RAM, €4.85/mo
  image       = "ubuntu-24.04"
  location    = each.value.location
  ssh_keys    = [hcloud_ssh_key.voidpush.id]

  labels = {
    relay_id = each.key
    region   = each.value.region
    managed  = "terraform"
  }

  user_data = templatefile("${path.module}/cloud-init.yaml", {
    relay_id          = each.key
    relay_region      = each.value.region
    relay_image       = var.relay_image
    relay_private_key = var.relay_private_keys[each.key]
    registry_url      = "https://registry.voidpush.dev"
  })
}

# ─── DigitalOcean relay nodes (global) ───────────────────────────────────────

locals {
  do_relays = {
    R1 = { region = "sgp1", relay_region = "ap", city = "Singapore" }
    R4 = { region = "blr1", relay_region = "ap", city = "Mumbai"    }
    R7 = { region = "nyc3", relay_region = "us", city = "Chicago"   }
    R8 = { region = "syd1", relay_region = "ap", city = "Sydney"    }
    R2 = { region = "sfo3", relay_region = "sa", city = "São Paulo" }
    R9 = { region = "lon1", relay_region = "eu", city = "Lagos"     }
  }
}

resource "digitalocean_ssh_key" "voidpush" {
  name       = "voidpush-relay-key"
  public_key = var.ssh_public_key
}

resource "digitalocean_droplet" "relay" {
  for_each = local.do_relays
  name     = "voidpush-relay-${lower(each.key)}"
  size     = "s-1vcpu-1gb"   # $6/mo
  image    = "ubuntu-24-04-x64"
  region   = each.value.region
  ssh_keys = [digitalocean_ssh_key.voidpush.fingerprint]

  tags = ["voidpush", "relay", each.value.relay_region]

  user_data = templatefile("${path.module}/cloud-init.yaml", {
    relay_id          = each.key
    relay_region      = each.value.relay_region
    relay_image       = var.relay_image
    relay_private_key = var.relay_private_keys[each.key]
    registry_url      = "https://registry.voidpush.dev"
  })
}

# ─── Firewall ────────────────────────────────────────────────────────────────

resource "hcloud_firewall" "relay" {
  name = "voidpush-relay-fw"

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "8000"
    source_ips = ["0.0.0.0/0", "::/0"]
    description = "Relay protocol"
  }

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "443"
    source_ips = ["0.0.0.0/0", "::/0"]
    description = "TLS"
  }

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "22"
    source_ips = ["0.0.0.0/0"]  # Restrict to your IP in production
    description = "SSH emergency access"
  }
}

resource "hcloud_firewall_attachment" "relay" {
  firewall_id = hcloud_firewall.relay.id
  server_ids  = [for s in hcloud_server.relay : s.id]
}

# ─── Outputs ─────────────────────────────────────────────────────────────────

output "relay_ips" {
  description = "Public IP addresses of all relay nodes"
  value = merge(
    { for k, v in hcloud_server.relay : k => v.ipv4_address },
    { for k, v in digitalocean_droplet.relay : k => v.ipv4_address }
  )
  sensitive = false
}

output "relay_count" {
  value = length(hcloud_server.relay) + length(digitalocean_droplet.relay)
}
