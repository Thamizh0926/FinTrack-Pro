package com.stocksuggest.stocksuggest.engine;

import org.springframework.stereotype.Component;
import java.util.List;

@Component
public class ReturnEngine {

    public double calculateCAGR(List<Double> prices) {

        if (prices.isEmpty()) return 0;

        double latest = prices.get(0);
        double oldest = prices.get(prices.size() - 1);
        double years = prices.size() / 12.0;

        return Math.pow(latest / oldest, 1 / years) - 1;
    }
}