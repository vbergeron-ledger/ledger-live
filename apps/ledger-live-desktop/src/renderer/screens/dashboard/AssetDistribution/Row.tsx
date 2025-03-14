import React, { useCallback } from "react";
import { useSelector } from "react-redux";
import { getEnv } from "@ledgerhq/live-env";
import { useCurrencyColor } from "~/renderer/getCurrencyColor";
import styled from "styled-components";
import CounterValue, { NoCountervaluePlaceholder } from "~/renderer/components/CounterValue";
import { useHistory } from "react-router-dom";
import useTheme from "~/renderer/hooks/useTheme";
import FormattedVal from "~/renderer/components/FormattedVal";
import Price from "~/renderer/components/Price";
import Text from "~/renderer/components/Text";
import Ellipsis from "~/renderer/components/Ellipsis";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import Tooltip from "~/renderer/components/Tooltip";
import Bar from "./Bar";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { localeSelector } from "~/renderer/reducers/settings";
import { DistributionItem } from "@ledgerhq/types-live";

type Props = {
  item: DistributionItem;
  isVisible: boolean;
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 16px 20px;
  > * {
    display: flex;
    align-items: center;
    flex-direction: row;
    box-sizing: border-box;
  }

  cursor: pointer;

  &:hover {
    background: ${p => p.theme.colors.palette.background.default};
  }
`;
const Asset = styled.div`
  flex: 1;
  width: 20%;
  > :first-child {
    margin-right: 10px;
  }
  > :nth-child(2) {
    margin-right: 8px;
  }
`;
const PriceSection = styled.div`
  width: 20%;
  text-align: left;
  > :first-child {
    padding-right: 24px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
    display: block;
  }
`;
const Distribution = styled.div`
  width: 20%;
  text-align: right;
  > :first-child {
    margin-right: 11px;
    width: 40px; //max width for a 99.99% case
    text-align: right;
  }
`;
const Amount = styled.div`
  width: 25%;
  justify-content: flex-end;
`;
const Value = styled.div`
  width: 15%;
  box-sizing: border-box;
  padding-left: 24px;
  justify-content: flex-end;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
const Row = ({ item: { currency, amount, distribution }, isVisible }: Props) => {
  const theme = useTheme();
  const history = useHistory();
  const locale = useSelector(localeSelector);
  const color = useCurrencyColor(currency, theme.colors.palette.background.paper);
  const percentage = Math.floor(distribution * 10000) / 100;
  const percentageWording = percentage.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  const icon = <CryptoCurrencyIcon currency={currency} size={16} />;
  const onClick = useCallback(() => {
    setTrackingSource("asset allocation");
    history.push({
      pathname: `/asset/${currency.id}`,
    });
  }, [currency, history]);
  return (
    <Wrapper onClick={onClick} data-testid={`asset-row-${currency.name.toLowerCase()}`}>
      <Asset>
        {icon}
        <Tooltip delay={1200} content={currency.name}>
          <Ellipsis ff="Inter|SemiBold" color="palette.text.shade100" fontSize={3}>
            {currency.name}
          </Ellipsis>
        </Tooltip>
      </Asset>
      <PriceSection>
        {distribution ? (
          // @ts-expect-error Need to change "color" type in Component
          <Price from={currency} color="palette.text.shade80" fontSize={3} />
        ) : (
          <NoCountervaluePlaceholder />
        )}
      </PriceSection>
      <Distribution>
        {!!distribution && (
          <>
            <Text ff="Inter" color="palette.text.shade100" fontSize={3}>
              {`${percentageWording}%`}
            </Text>
            <Bar
              progress={!getEnv("PLAYWRIGHT_RUN") && isVisible ? percentage : 0}
              progressColor={color}
            />
          </>
        )}
      </Distribution>
      <Amount>
        <Ellipsis>
          <FormattedVal
            color={"palette.text.shade80"}
            unit={currency.units[0]}
            val={amount}
            fontSize={3}
            showCode
          />
        </Ellipsis>
      </Amount>
      <Value>
        <Ellipsis>
          {distribution ? (
            <CounterValue
              data-testid={`asset-row-${currency.name.toLowerCase()}-value`}
              currency={currency}
              value={amount}
              color="palette.text.shade100"
              fontSize={3}
              showCode
            />
          ) : (
            <NoCountervaluePlaceholder />
          )}
        </Ellipsis>
      </Value>
    </Wrapper>
  );
};
export default Row;
