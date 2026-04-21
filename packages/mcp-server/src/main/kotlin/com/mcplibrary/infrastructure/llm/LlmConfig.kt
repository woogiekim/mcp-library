package com.mcplibrary.infrastructure.llm

import com.mcplibrary.domain.llm.LlmPort
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@ConfigurationProperties(prefix = "llm")
data class LlmProperties(
    val provider: String = "ollama",
    val model: String = "llama3.1",
    val baseUrl: String = "http://localhost:11434/v1",
    val apiKey: String = "ollama",
)

@Configuration
@EnableConfigurationProperties(LlmProperties::class)
class LlmConfig(private val props: LlmProperties) {

    @Bean
    fun llmPort(): LlmPort = when (props.provider.lowercase()) {
        "anthropic" -> AnthropicLlmAdapter(
            apiKey = props.apiKey,
            model = props.model,
        )
        "ollama", "openai", "groq", "lmstudio" -> OpenAiCompatibleLlmAdapter(
            baseUrl = props.baseUrl,
            apiKey = props.apiKey,
            model = props.model,
        )
        else -> throw IllegalArgumentException(
            "지원하지 않는 LLM provider: '${props.provider}'. " +
            "지원 목록: anthropic, ollama, openai, groq, lmstudio"
        )
    }
}
