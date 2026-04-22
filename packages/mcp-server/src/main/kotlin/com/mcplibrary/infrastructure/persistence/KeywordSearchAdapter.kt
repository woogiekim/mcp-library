package com.mcplibrary.infrastructure.persistence

import com.mcplibrary.domain.search.KeywordSearchPort
import com.mcplibrary.domain.usecase.UseCase
import org.springframework.stereotype.Component

@Component
class KeywordSearchAdapter(
    private val useCaseRepository: UseCaseJpaRepositoryAdapter,
) : KeywordSearchPort {
    override fun search(query: String, limit: Int): List<UseCase> {
        val terms = normalize(query)
        if (terms.isEmpty()) return emptyList()

        return useCaseRepository.findAll()
            .map { uc -> uc to score(uc, terms) }
            .filter { (_, score) -> score > 0 }
            .sortedByDescending { (_, score) -> score }
            .take(limit)
            .map { (uc, _) -> uc }
    }

    private fun normalize(text: String): List<String> =
        text.lowercase()
            .split(Regex("[\\s,.?!]+"))
            .filter { it.length >= 2 }
            .flatMap { token ->
                // 모든 접두 부분 문자열을 생성: "취소가능한지" → ["취소", "취소가", ..., "취소가능한지"]
                // 이렇게 하면 복합어·어미 붙은 형태 모두 커버 가능
                (2..token.length).map { token.substring(0, it) }
            }
            .distinct()

    private fun score(uc: UseCase, terms: List<String>): Int {
        val corpus = buildString {
            append(uc.domain.value); append(" ")
            append(uc.title.value); append(" ")
            uc.scenarios().items().forEach { append(it.description); append(" ") }
            uc.rules().items().forEach { append(it.description); append(" "); append(it.constraint); append(" ") }
            uc.exceptions().items().forEach { append(it.condition); append(" "); append(it.handling); append(" ") }
        }.lowercase()

        return terms.count { corpus.contains(it) }
    }
}
