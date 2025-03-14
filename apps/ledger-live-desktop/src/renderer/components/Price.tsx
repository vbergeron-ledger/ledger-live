import React, { useMemo } from "react";
import styled from "styled-components";
import { BigNumber } from "bignumber.js";
import { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import { getCurrencyColor } from "~/renderer/getCurrencyColor";
import { colors } from "~/renderer/styles/theme";
import useTheme from "~/renderer/hooks/useTheme";
import Box from "~/renderer/components/Box";
import CurrencyUnitValue from "~/renderer/components/CurrencyUnitValue";
import IconActivity from "~/renderer/icons/Activity";
import { NoCountervaluePlaceholder } from "./CounterValue";
import { usePrice } from "~/renderer/hooks/usePrice";

type ColorKeys = keyof typeof colors;

type Props = {
  unit?: Unit;
  rate?: BigNumber;
  showAllDigits?: boolean;
  from: Currency;
  to?: Currency;
  withActivityCurrencyColor?: boolean;
  withActivityColor?: ColorKeys;
  withIcon?: boolean;
  withEquality?: boolean;
  color?: ColorKeys; // TODO change type of this props
  fontSize?: number;
  fontWeight?: number;
  iconSize?: number;
  placeholder?: React.ReactNode;
  dynamicSignificantDigits?: number;
  staticSignificantDigits?: number;
};
export default function Price({
  from,
  to,
  unit,
  withActivityCurrencyColor,
  withActivityColor,
  withEquality,
  placeholder,
  color,
  fontSize,
  fontWeight,
  iconSize,
  showAllDigits,
  withIcon = true,
  rate,
  dynamicSignificantDigits,
  staticSignificantDigits,
}: Props) {
  const { counterValue, valueNum, effectiveUnit, counterValueCurrency } = usePrice(
    from,
    to,
    unit,
    rate,
  );
  const theme = useTheme();
  const textColor = useMemo(
    () => (color ? colors[color] : theme.colors.palette.text.shade100),
    [color, theme],
  );
  const bgColor = theme.colors.palette.background.paper;
  const activityColor = useMemo(
    () =>
      withActivityColor
        ? colors[withActivityColor]
        : !withActivityCurrencyColor
          ? textColor
            ? textColor
            : undefined
          : getCurrencyColor(from, bgColor),
    [bgColor, textColor, from, withActivityColor, withActivityCurrencyColor],
  );
  if (!counterValue || counterValue.isZero())
    return <NoCountervaluePlaceholder placeholder={placeholder} />;
  const subMagnitude = counterValue.lt(1) || showAllDigits ? 1 : 0;
  return (
    <PriceWrapper color={textColor} fontSize={fontSize} fontWeight={fontWeight}>
      {withIcon ? (
        <IconActivity
          size={iconSize || 12}
          style={{
            color: activityColor,
            marginRight: 4,
          }}
        />
      ) : null}
      {!withEquality ? null : (
        <>
          <CurrencyUnitValue value={BigNumber(valueNum)} unit={effectiveUnit} showCode />
          {" = "}
        </>
      )}
      <CurrencyUnitValue
        unit={counterValueCurrency.units[0]}
        value={counterValue}
        disableRounding={!!subMagnitude}
        subMagnitude={subMagnitude}
        dynamicSignificantDigits={dynamicSignificantDigits}
        staticSignificantDigits={staticSignificantDigits}
        showCode
      />
    </PriceWrapper>
  );
}
const PriceWrapper = styled(Box).attrs(() => ({
  ff: "Inter",
  horizontal: true,
}))`
  line-height: 1.2;
  white-space: pre;
  align-items: baseline;
`;
