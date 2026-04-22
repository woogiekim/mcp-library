package com.mcplibrary.infrastructure.llm

import okhttp3.OkHttpClient
import okhttp3.Protocol
import org.springframework.http.client.OkHttp3ClientHttpRequestFactory
import org.springframework.web.client.RestClient
import java.util.concurrent.TimeUnit

object HttpClientFactory {
    private val okHttpClient = OkHttpClient.Builder()
        .protocols(listOf(Protocol.HTTP_1_1))
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(120, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    fun restClient(baseUrl: String, vararg defaultHeaders: Pair<String, String>): RestClient {
        var builder = RestClient.builder()
            .requestFactory(OkHttp3ClientHttpRequestFactory(okHttpClient))
            .baseUrl(baseUrl)
        defaultHeaders.forEach { (k, v) ->
            builder = builder.defaultHeader(k, v)
        }
        return builder.build()
    }
}
