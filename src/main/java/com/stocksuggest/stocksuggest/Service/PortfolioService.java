package com.stocksuggest.stocksuggest.Service;

import com.stocksuggest.stocksuggest.client.AlphaVantageClient;
import com.stocksuggest.stocksuggest.engine.AllocationEngine;
import com.stocksuggest.stocksuggest.engine.RiskEngine;
import com.stocksuggest.stocksuggest.engine.ReturnEngine;
import com.stocksuggest.stocksuggest.model.PortfolioResponse;
import com.stocksuggest.stocksuggest.model.StockAnalysis;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class PortfolioService {

    private final AlphaVantageClient client;
    private final ReturnEngine returnEngine;
    private final RiskEngine riskEngine;
    private final AllocationEngine allocationEngine;

    private final List<String> symbols = List.of("AAPL", "MSFT", "TSLA", "IBM");

    public PortfolioService(AlphaVantageClient client, ReturnEngine returnEngine,
                            RiskEngine riskEngine, AllocationEngine allocationEngine) {

        this.client = client;
        this.returnEngine = returnEngine;
        this.riskEngine = riskEngine;
        this.allocationEngine = allocationEngine;
    }

    public PortfolioResponse analyze(double investment, String risk, int months) {

        List<StockAnalysis> analyses = new ArrayList<>();

        for (String symbol : symbols) {

            List<Double> prices = client.getMonthlyClosingPrices(symbol, months);

            // Skip stock if no data
            if (prices == null || prices.size() < 2) {
                continue;
            }

            double expectedReturn = returnEngine.calculateCAGR(prices);
            double volatility = riskEngine.calculateVolatility(prices);
            int riskScore = riskEngine.riskScore(volatility);

            analyses.add(new StockAnalysis(
                    symbol,
                    expectedReturn,
                    volatility,
                    riskScore
            ));
        }

        // -------------------------------------------------
        // ✅ Remove stocks with negative return
        // (Prevents negative allocation)
        // -------------------------------------------------

        List<StockAnalysis> filteredAnalyses = analyses.stream()
                .filter(stock -> stock.getExpectedReturn() > 0)
                .toList();

        // If all stocks are negative, fallback to original list
        if (filteredAnalyses.isEmpty()) {
            filteredAnalyses = analyses;
        }

        Map<String, Double> allocation =
                allocationEngine.allocate(filteredAnalyses, risk);

        return new PortfolioResponse(
                investment,
                risk,
                months,
                analyses,      // keep original full analysis
                allocation
        );
    }
}