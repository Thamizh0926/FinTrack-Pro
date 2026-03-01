package com.stocksuggest.stocksuggest.engine;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class RiskEngine {

    private static final double MAX_VOL = 0.40;

    public double calculateVolatility(List<Double> prices) {

        if (prices.size() < 2) return 0;

        List<Double> returns = new ArrayList<>();
        for (int i = 1; i < prices.size(); i++) {
            returns.add((prices.get(i - 1) - prices.get(i)) / prices.get(i));
        }

        double mean = returns.stream()
                .mapToDouble(Double::doubleValue)
                .average().orElse(0);

        double variance = returns.stream()
                .mapToDouble(r -> Math.pow(r - mean, 2))
                .average().orElse(0);

        return Math.sqrt(variance);
    }

    public int riskScore(double volatility) {
        double normalized = (volatility / MAX_VOL) * 100;
        if (normalized > 100) normalized = 100;
        if (normalized < 1) normalized = 1;
        return (int) normalized;
    }
}