package com.mcplibrary.application

import com.mcplibrary.domain.llm.LlmPort
import com.mcplibrary.domain.llm.LlmRequest
import com.mcplibrary.domain.usecase.UseCase
import org.springframework.stereotype.Service

@Service
class LlmService(private val llmPort: LlmPort) {

    fun answer(query: String, relevantUseCases: List<UseCase>): String {
        val request = LlmRequest(
            systemPrompt = buildSystemPrompt(relevantUseCases),
            userMessage = query,
        )
        return llmPort.complete(request).content
    }

    private fun buildSystemPrompt(useCases: List<UseCase>): String {
        val context = useCases.joinToString("\n\n") { it.buildContextText() }
        return """
당신은 소프트웨어 개발팀의 도메인 전문가 어시스턴트입니다.
반드시 아래 UseCase 정의에 기반하여 답변하세요.
UseCase에 정의되지 않은 내용은 추측하지 말고, "정의된 UseCase에 해당 내용이 없습니다"라고 답하세요.

--- UseCase Context ---
$context
--- End Context ---

답변 형식:
1. 관련 정책/규칙 요약
2. 단계별 가이드 (해당 시)
3. 주의사항 (예외 케이스)
        """.trimIndent()
    }
}
