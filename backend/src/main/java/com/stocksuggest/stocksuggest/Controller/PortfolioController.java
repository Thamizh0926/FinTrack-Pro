package com.stocksuggest.stocksuggest.Controller;

import com.stocksuggest.stocksuggest.model.PortfolioResponse;
import com.stocksuggest.stocksuggest.Service.PortfolioService;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins="*")
@RestController
@RequestMapping("/api/portfolio")
public class PortfolioController {

    private final PortfolioService Service;

    public PortfolioController(PortfolioService service) {
        this.Service = service;
    }

    @GetMapping("/analyze")
    public PortfolioResponse analyze(@RequestParam double investment,
                                     @RequestParam String risk,
                                     @RequestParam int months) {

        return Service.analyze(investment, risk, months);
    }
}