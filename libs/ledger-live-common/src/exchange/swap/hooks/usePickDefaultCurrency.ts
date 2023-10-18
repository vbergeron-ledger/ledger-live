import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useEffect } from "react";
import { currenciesByMarketcap } from "../../../currencies";

// Pick a default currency target if none are selected.
export const usePickDefaultCurrency = (
  currencies: (CryptoCurrency | TokenCurrency)[],
  currency: (CryptoCurrency | TokenCurrency) | null | undefined,
  setCurrency: (currency: CryptoCurrency | TokenCurrency) => void,
): void => {
  useEffect(() => {
    // Keep the same currency target if it is still valid.
    const isCurrencyValid = currency && currencies.indexOf(currency) >= 0;
    if (!currency || !isCurrencyValid) {
      const defaultCurrency = currencies.find(
        currency => currency.id === "ethereum" || currency.id === "bitcoin",
      );

      if (defaultCurrency) {
        setCurrency(defaultCurrency);
      } else {
        currenciesByMarketcap(currencies).then(sortedCurrencies => {
          setCurrency(sortedCurrencies[0]);
        });
      }
    }
  }, [currency, currencies, setCurrency]);
};
