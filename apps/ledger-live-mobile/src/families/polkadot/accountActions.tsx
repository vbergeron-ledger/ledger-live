import React from "react";
import { Trans } from "react-i18next";
import invariant from "invariant";
import type { Account } from "@ledgerhq/types-live";
import {
  canNominate,
  canBond,
  canUnbond,
  hasExternalController,
  hasExternalStash,
  hasPendingOperationType,
  isElectionOpen,
  isStash,
} from "@ledgerhq/live-common/families/polkadot/logic";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { PolkadotAccount } from "@ledgerhq/live-common/families/polkadot/types";
import { ParamListBase, RouteProp } from "@react-navigation/native";
import BondIcon from "~/icons/LinkIcon";
import UnbondIcon from "~/icons/Undelegate";
import WithdrawUnbondedIcon from "~/icons/Coins";
import NominateIcon from "~/icons/Vote";
import ChillIcon from "~/icons/VoteNay";
import { NavigatorName, ScreenName } from "~/const";
import { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";
import { getStakeLabelLocaleBased } from "~/helpers/getStakeLabelLocaleBased";

const getMainActions = (args: {
  account: PolkadotAccount;
  parentAccount?: Account;
  parentRoute?: RouteProp<ParamListBase, ScreenName>;
}): ActionButtonEvent[] | null => {
  const { account, parentAccount, parentRoute } = args;
  invariant(account.polkadotResources, "polkadot resources required");
  const accountId = account.id;
  const { lockedBalance } = account.polkadotResources || {};
  const electionOpen = isElectionOpen();
  const hasBondedBalance = lockedBalance && lockedBalance.gt(0);
  const hasPendingBondOperation = hasPendingOperationType(account, "BOND");
  const nominationEnabled = !electionOpen && canNominate(account);
  const label = getStakeLabelLocaleBased();

  const earnRewardsEnabled = !electionOpen && !hasBondedBalance && !hasPendingBondOperation;

  if (hasExternalController(account) || hasExternalStash(account)) {
    return null;
  }

  const getNavigationParams = (): NavigationParamsType => {
    if (!earnRewardsEnabled && !nominationEnabled) {
      return [
        NavigatorName.NoFundsFlow,
        {
          screen: ScreenName.NoFunds,
          params: {
            account,
            parentAccount,
          },
        },
      ];
    }
    if (isStash(account)) {
      return [
        NavigatorName.PolkadotNominateFlow,
        {
          screen: ScreenName.PolkadotNominateSelectValidators,
          params: {
            accountId,
            source: parentRoute,
          },
        },
      ];
    }
    return [
      NavigatorName.PolkadotBondFlow,
      {
        screen: ScreenName.PolkadotBondStarted,
        params: {
          accountId,
        },
      },
    ];
  };

  const navigationParams = getNavigationParams();

  return [
    {
      id: "stake",
      navigationParams,
      label: <Trans i18nKey={label} />,
      Icon: IconsLegacy.CoinsMedium,
      eventProperties: {
        currency: "DOT",
      },
    },
  ];
};

const getSecondaryActions = (args: {
  account: PolkadotAccount;
  parentAccount?: Account;
  parentRoute?: RouteProp<ParamListBase, ScreenName>;
}): ActionButtonEvent[] | null => {
  const { account, parentRoute } = args;
  if (!account.polkadotResources) return null;
  const accountId = account.id;
  const { unlockedBalance, lockedBalance, nominations } = account.polkadotResources || {};
  const electionOpen = isElectionOpen();
  const hasUnlockedBalance = unlockedBalance && unlockedBalance.gt(0);
  const hasBondedBalance = lockedBalance && lockedBalance.gt(0);
  const hasPendingBondOperation = hasPendingOperationType(account, "BOND");
  const hasPendingWithdrawUnbondedOperation = hasPendingOperationType(account, "WITHDRAW_UNBONDED");
  const nominationEnabled = !electionOpen && canNominate(account);
  const chillEnabled = !electionOpen && nominations?.length;
  const bondingEnabled =
    !electionOpen &&
    ((!hasBondedBalance && !hasPendingBondOperation) || (hasBondedBalance && canBond(account)));
  const unbondingEnabled = !electionOpen && canUnbond(account);
  const withdrawEnabled =
    !electionOpen && hasUnlockedBalance && !hasPendingWithdrawUnbondedOperation;

  if (hasExternalController(account) || hasExternalStash(account)) {
    return null;
  }

  return [
    {
      id: "bond",
      disabled: !bondingEnabled,
      navigationParams: [
        NavigatorName.PolkadotBondFlow,
        {
          screen: ScreenName.PolkadotBondAmount,
          params: {
            accountId,
          },
        },
      ],
      label: <Trans i18nKey="polkadot.manage.bond.title" />,
      description: <Trans i18nKey="polkadot.manage.bond.description" />,
      Icon: BondIcon,
    },
    {
      id: "unbond",
      disabled: !unbondingEnabled,
      navigationParams: [
        NavigatorName.PolkadotUnbondFlow,
        {
          screen: ScreenName.PolkadotUnbondAmount,
          params: {
            accountId,
          },
        },
      ],
      label: <Trans i18nKey="polkadot.manage.unbond.title" />,
      description: <Trans i18nKey="polkadot.manage.unbond.description" />,
      Icon: UnbondIcon,
    },
    {
      id: "withdrawUnbonded",
      disabled: !withdrawEnabled,
      navigationParams: [
        NavigatorName.PolkadotSimpleOperationFlow,
        {
          screen: ScreenName.PolkadotSimpleOperationStarted,
          params: {
            mode: "withdrawUnbonded",
            accountId,
          },
        },
      ],
      label: <Trans i18nKey="polkadot.manage.withdrawUnbonded.title" />,
      description: <Trans i18nKey="polkadot.manage.withdrawUnbonded.description" />,
      Icon: WithdrawUnbondedIcon,
    },
    {
      id: "nominate",
      disabled: !nominationEnabled,
      navigationParams: [
        NavigatorName.PolkadotNominateFlow,
        {
          screen: ScreenName.PolkadotNominateSelectValidators,
          params: {
            accountId,
            source: parentRoute,
          },
        },
      ],
      label: <Trans i18nKey="polkadot.manage.nominate.title" />,
      description: <Trans i18nKey="polkadot.manage.nominate.description" />,
      Icon: NominateIcon,
    },
    {
      id: "chill",
      disabled: !chillEnabled,
      navigationParams: [
        NavigatorName.PolkadotSimpleOperationFlow,
        {
          screen: ScreenName.PolkadotSimpleOperationStarted,
          params: {
            mode: "chill",
            accountId,
          },
        },
      ],
      label: <Trans i18nKey="polkadot.manage.chill.title" />,
      description: <Trans i18nKey="polkadot.manage.chill.description" />,
      Icon: ChillIcon,
    },
  ];
};

export default {
  getMainActions,
  getSecondaryActions,
};
