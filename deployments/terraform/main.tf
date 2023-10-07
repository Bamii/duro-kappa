
terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0.1"
    }
  }
}

provider "docker" {}

variable "env" {
  description = "A list of environment variables"
  type = list(string)
  default = []
}

resource "docker_network" "link" {
  name = "link"
  driver = "bridge"
}

resource "docker_image" "door" {
  name         = "bbamii/duro-door:latest"
  keep_locally = true
}

resource "docker_image" "doorman" {
  name         = "bbamii/duro-doorman:latest"
  keep_locally = true
}

resource "docker_image" "frontend" {
  name         = "bbamii/duro-butler:latest"
  keep_locally = true
}

resource "docker_image" "jobs" {
  name         = "bbamii/duro-tray:latest"
  keep_locally = true
}

resource "docker_image" "queue" {
  name         = "redis:latest"
  keep_locally = true
}

resource "docker_image" "db" {
  name         = "postgres:latest"
  keep_locally = true
}


resource "docker_container" "door" {
  name  = "door"
  image = docker_image.door.image_id
  restart = "always"

  networks_advanced {
    name = docker_network.link.name
  }

  ports {
    internal = 8080
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

  env = var.env
  networks_advanced {
    name = docker_network.link.name
  }
}

resource "docker_container" "jobs" {
  name  = "jobs"
  image = docker_image.jobs.image_id
  restart = "always"
  must_run = true

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
  
  networks_advanced {
    name = docker_network.link.name
  }
}
