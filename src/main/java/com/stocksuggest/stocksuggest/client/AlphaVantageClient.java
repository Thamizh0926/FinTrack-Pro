package com.stocksuggest.stocksuggest.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Component
public class AlphaVantageClient {

    @Value("${alphavantage.api.key}")
    private String apiKey;

    @Value("${alphavantage.base.url}")
    private String baseUrl;

    private final RestTemplate restTemplate;

    public AlphaVantageClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public List<Double> getMonthlyClosingPrices(String symbol, int months) {

        String url = baseUrl +
                "?function=TIME_SERIES_MONTHLY" +
                "&symbol=" + symbol +
                "&apikey=" + apiKey;

        Map<String, Object> response =
                restTemplate.getForObject(url, Map.class);

        // Basic validation
        if (response == null || !response.containsKey("Monthly Time Series")) {
            return Collections.emptyList();
        }

        Object seriesObj = response.get("Monthly Time Series");

        if (!(seriesObj instanceof Map<?, ?> rawSeries)) {
            return Collections.emptyList();
        }

        // ✅ Sort dates in descending order (latest first)
        List<String> sortedDates = rawSeries.keySet()
                .stream()
                .map(Object::toString)
                .sorted(Comparator.reverseOrder())
                .toList();

        List<Double> prices = new ArrayList<>();

        for (int i = 0; i < sortedDates.size() && i < months; i++) {

            Object value = rawSeries.get(sortedDates.get(i));

            if (value instanceof Map<?, ?> innerMap) {

                Object closeValue = innerMap.get("4. close");

                if (closeValue != null) {
                    try {
                        prices.add(Double.parseDouble(closeValue.toString()));
                    } catch (NumberFormatException ignored) {
                        // Skip invalid values safely
                    }
                }
            }
        }

        return prices;
    }
}