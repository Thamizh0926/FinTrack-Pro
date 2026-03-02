package com.stocksuggest.stocksuggest.model;

import java.util.List;
import java.util.Map;
import com.stocksuggest.stocksuggest.model.StockAnalysis;

public class PortfolioResponse {

    private final double investment;
    private final String riskLevel;
    private final int months;
    private final List<StockAnalysis> stocks;
    private final Map<String, Double> allocation;

    public PortfolioResponse(double investment, String riskLevel, int months,
                             List<StockAnalysis> stocks, Map<String, Double> allocation) {

        this.investment = investment;
        this.riskLevel = riskLevel;
        this.months = months;
        this.stocks = stocks;
        this.allocation = allocation;
    }

    public double getInvestment() { return investment; }
    public String getRiskLevel() { return riskLevel; }
    public int getMonths() { return months; }
    public List<StockAnalysis> getStocks() { return stocks; }
    public Map<String, Double> getAllocation() { return allocation; }
}