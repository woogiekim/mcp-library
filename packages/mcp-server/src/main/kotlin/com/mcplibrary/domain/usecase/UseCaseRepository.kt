package com.mcplibrary.domain.usecase

interface UseCaseRepository {
    fun save(useCase: UseCase): UseCase
    fun findById(id: UseCaseId): UseCase?
    fun findAll(): List<UseCase>
    fun findByDomain(domain: Domain): List<UseCase>
    fun delete(id: UseCaseId)
    fun existsById(id: UseCaseId): Boolean
}
