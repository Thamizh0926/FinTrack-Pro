package com.stocksuggest.stocksuggest.model;

public class StockAnalysis {

    private final String symbol;
    private final double expectedReturn;
    private final double volatility;
    private final int riskScore;

    public StockAnalysis(String symbol,
                         double expectedReturn,
                         double volatility,
                         int riskScore) {

        this.symbol = symbol;
        this.expectedReturn = expectedReturn;
        this.volatility = volatility;
        this.riskScore = riskScore;
    }

    public String getSymbol() {
        return symbol;
    }

    public double getExpectedReturn() {
        return expectedReturn;
    }

    public double getVolatility() {
        return volatility;
    }

    public int getRiskScore() {
        return riskScore;
    }
}