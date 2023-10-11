
terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0.1"
    }
  }
}

provider "docker" {}

variable "postgress" {
  description = "environment variables"
  type        = set(string)
  
  default = []
}

variable "env" {
  description = "environment variables"
  type        = set(string)
  
  default = []
}

resource "docker_network" "link" {
  name = "link"
  driver = "bridge"
}

data "docker_registry_image" "door" {
  name = "bbamii/duro-door:latest"
}

resource "docker_image" "door" {
  name          = data.docker_registry_image.door.name
  pull_triggers = [data.docker_registry_image.door.sha256_digest]
}

data "docker_registry_image" "doorman" {
  name = "bbamii/duro-doorman:latest"
}

resource "docker_image" "doorman" {
  name          = data.docker_registry_image.doorman.name
  pull_triggers = [data.docker_registry_image.doorman.sha256_digest]
}


data "docker_registry_image" "frontend" {
  name = "bbamii/duro-butler:latest"
}

resource "docker_image" "frontend" {
  name          = data.docker_registry_image.frontend.name
  pull_triggers = [data.docker_registry_image.frontend.sha256_digest]
}

data "docker_registry_image" "jobs" {
  name = "bbamii/duro-tray:latest"
}

resource "docker_image" "jobs" {
  name          = data.docker_registry_image.jobs.name
  pull_triggers = [data.docker_registry_image.jobs.sha256_digest]
}

resource "docker_image" "queue" {
  name         = "redis:latest"
}

resource "docker_image" "db" {
  name         = "postgres:latest"
}


resource "docker_container" "door" {
  name  = "door"
  image = docker_image.door.image_id
  restart = "always"

  networks_advanced {
    name = docker_network.link.name
  }

  ports {
    internal = 80    
    external = 80
  }
}

resource "docker_container" "doorman" {
  name = "doorman"
  image = docker_image.doorman.image_id

  must_run = true
  depends_on = [docker_container.db, docker_container.queue]

  env = var.env
  networks_advanced {
    name = docker_network.link.name
  }
}

resource "docker_container" "frontend" {
  name  = "frontend"
  image = docker_image.frontend.image_id
  must_run = true

  env = ["NEXT_PUBLIC_API_URL=http://doorman"]
  networks_advanced {
    name = docker_network.link.name
  }
}

resource "docker_container" "jobs" {
  name  = "jobs"
  image = docker_image.jobs.image_id
  restart = "always"
  must_run = true

  env = var.env
  networks_advanced {
    name = docker_network.link.name
  }
}

resource "docker_container" "queue" {
  image = docker_image.queue.image_id
  name  = "queue"
  restart = "always"
  must_run = true

  networks_advanced {
    name = docker_network.link.name
  }
}

resource "docker_container" "db" {
  image = docker_image.db.image_id
  name  = "db"
  restart = "always"
  must_run = true
  
  env = var.postgress
  networks_advanced {
    name = docker_network.link.name
  }
}
