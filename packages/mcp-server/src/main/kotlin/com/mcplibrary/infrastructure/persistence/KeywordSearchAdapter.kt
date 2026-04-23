package com.mcplibrary.infrastructure.persistence

import com.mcplibrary.domain.search.KeywordSearchPort
import com.mcplibrary.domain.usecase.UseCase
import org.springframework.stereotype.Component

@Component
class KeywordSearchAdapter(
    private val useCaseRepository: UseCaseJpaRepositoryAdapter,
) : KeywordSearchPort {

    override fun search(query: String, limit: Int): List<UseCase> {
        val baseTerms = splitTerms(query)
        if (baseTerms.isEmpty()) return emptyList()

        // 단어 개수의 절반 이상이 매칭돼야 반환 (올림)
        val minMatched = (baseTerms.size + 1) / 2

        return useCaseRepository.findAll()
            .map { uc ->
                val corpus = buildCorpus(uc)
                val matched = baseTerms.count { termMatches(corpus, it) }
                uc to matched
            }
            .filter { (_, matched) -> matched >= minMatched }
            .sortedByDescending { (_, matched) -> matched }
            .take(limit)
            .map { (uc, _) -> uc }
    }

    /** 쿼리를 공백/구두점으로 분리한 순수 단어 목록 */
    private fun splitTerms(text: String): List<String> =
        text.lowercase()
            .split(Regex("[\\s,.?!]+"))
            .filter { it.length >= 2 }
            .distinct()

    /**
     * 한국어 형태소 변형을 커버하기 위해 prefix 방식으로 매칭.
     * "취소가능한지" 검색 시 corpus의 "취소가능" 도 히트.
     */
    private fun termMatches(corpus: String, term: String): Boolean =
        (2..term.length).any { len -> corpus.contains(term.substring(0, len)) }

    private fun buildCorpus(uc: UseCase): String = buildString {
        append(uc.domain.value); append(" ")
        append(uc.title.value); append(" ")
        uc.scenarios().items().forEach { append(it.description); append(" ") }
        uc.rules().items().forEach { append(it.description); append(" "); append(it.constraint); append(" ") }
        uc.exceptions().items().forEach { append(it.condition); append(" "); append(it.handling); append(" ") }
    }.lowercase()
}
