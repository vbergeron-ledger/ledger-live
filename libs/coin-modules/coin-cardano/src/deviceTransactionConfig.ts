import BigNumber from "bignumber.js";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/coin-framework/account/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import type { CommonDeviceTransactionField as DeviceTransactionField } from "@ledgerhq/coin-framework/transaction/common";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { decodeTokenAssetId, decodeTokenCurrencyId } from "./buildSubAccounts";
import { CardanoAccount, Transaction, TransactionStatus } from "./types";
import { utils as TyphonUtils } from "@stricahq/typhonjs";
import {
  decodeTokenName,
  getAccountStakeCredential,
  getBech32PoolId,
  getBipPathString,
} from "./logic";
import { CARDANO_MAX_SUPPLY } from "./constants";

function getDeviceTransactionConfig({
  account,
  transaction,
  parentAccount,
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const { mode } = transaction;
  const fields: DeviceTransactionField[] = [];
  const mainAccount = getMainAccount(account, parentAccount);
  const cardanoResources = (mainAccount as CardanoAccount).cardanoResources;

  const { fees } = transaction;
  if (fees) {
    fields.push({
      type: "text",
      label: "Transaction Fee",
      value: formatCurrencyUnit(getAccountCurrency(mainAccount).units[0], fees, {
        showCode: true,
        disableRounding: true,
      }),
    });
  }

  if (mode === "send") {
    if (account.type === "TokenAccount") {
      const { assetId } = decodeTokenCurrencyId(account.token.id);
      const { policyId, assetName } = decodeTokenAssetId(assetId);
      const transactionAmount = transaction.useAllAmount ? account.balance : transaction.amount;

      const tokensToSend = [
        {
          policyId,
          assetName,
          amount: transactionAmount,
        },
      ];

      const recipient = TyphonUtils.getAddressFromString(transaction.recipient);
      const requiredMinAdaForTokens = TyphonUtils.calculateMinUtxoAmountBabbage(
        {
          address: recipient,
          amount: new BigNumber(CARDANO_MAX_SUPPLY),
          tokens: tokensToSend,
        },
        new BigNumber(cardanoResources.protocolParams.utxoCostPerByte),
      );
      fields.push({
        type: "text",
        label: "ADA",
        value: formatCurrencyUnit(
          getAccountCurrency(mainAccount).units[0],
          requiredMinAdaForTokens,
          {
            showCode: true,
            disableRounding: true,
          },
        ),
      });
      fields.push({
        type: "text",
        label: "Token Name",
        value: decodeTokenName(assetName),
      });
      fields.push({
        type: "text",
        label: "Amount",
        value: formatCurrencyUnit(getAccountCurrency(account).units[0], transactionAmount, {
          showCode: true,
          disableRounding: true,
        }),
      });
    } else if (account.type === "Account") {
      fields.push({
        type: "text",
        label: "Amount",
        value: formatCurrencyUnit(getAccountCurrency(account).units[0], transaction.amount, {
          showCode: true,
          disableRounding: true,
        }),
      });
    }
  } else if (mode === "delegate" && account.type === "Account") {
    const stakeCredential = getAccountStakeCredential(account.xpub as string, account.index);
    fields.push({
      type: "text",
      label: "Staking key",
      value: getBipPathString({
        account: stakeCredential.path.account,
        chain: stakeCredential.path.chain,
        index: stakeCredential.path.index,
      }),
    });
    fields.push({
      type: "text",
      label: "Delegate stake to",
      value: getBech32PoolId(transaction.poolId as string, account.currency.id),
    });
  } else if (mode === "undelegate" && account.type === "Account") {
    const stakeCredential = getAccountStakeCredential(account.xpub as string, account.index);
    fields.push({
      type: "text",
      label: "Staking key",
      value: getBipPathString({
        account: stakeCredential.path.account,
        chain: stakeCredential.path.chain,
        index: stakeCredential.path.index,
      }),
    });
  }

  return fields;
}

export default getDeviceTransactionConfig;
