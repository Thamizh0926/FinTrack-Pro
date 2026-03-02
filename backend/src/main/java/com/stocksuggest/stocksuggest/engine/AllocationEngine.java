package com.stocksuggest.stocksuggest.engine;

import com.stocksuggest.stocksuggest.model.StockAnalysis;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class AllocationEngine {

    public Map<String, Double> allocate(List<StockAnalysis> stocks, String riskLevel) {

        Map<String, Double> allocation = new HashMap<>();

        if (riskLevel.equalsIgnoreCase("low")) {
            stocks.sort(Comparator.comparingDouble(StockAnalysis::getVolatility));
        } else if (riskLevel.equalsIgnoreCase("high")) {
            stocks.sort(Comparator.comparingDouble(StockAnalysis::getExpectedReturn).reversed());
        }

        double totalWeight = stocks.stream().mapToDouble(StockAnalysis::getExpectedReturn).sum();
        for (StockAnalysis stock : stocks) {
            allocation.put(stock.getSymbol(), (stock.getExpectedReturn() / totalWeight) * 100);
        }

        return allocation;
    }
}