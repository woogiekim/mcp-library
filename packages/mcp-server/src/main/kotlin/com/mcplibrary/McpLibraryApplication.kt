package com.mcplibrary

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class McpLibraryApplication

fun main(args: Array<String>) {
    runApplication<McpLibraryApplication>(*args)
}
