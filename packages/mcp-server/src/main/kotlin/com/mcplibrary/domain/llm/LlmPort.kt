package com.mcplibrary.domain.llm

interface LlmPort {
    fun complete(request: LlmRequest): LlmResponse
}

data class LlmRequest(
    val systemPrompt: String,
    val userMessage: String,
    val maxTokens: Int = 2048,
)

data class LlmResponse(
    val content: String,
    val provider: String,
)
