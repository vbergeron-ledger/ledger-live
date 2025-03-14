import React, { useCallback, useContext, useEffect } from "react";
import { Flex, Link, Text } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import { useHistory } from "react-router-dom";
import OnboardingNavHeader from "../../Onboarding/OnboardingNavHeader";
import { OnboardingContext } from "../../Onboarding";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import Animation from "~/renderer/animations";
import useTheme from "~/renderer/hooks/useTheme";
import { useSelector } from "react-redux";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { isSyncOnboardingSupported } from "@ledgerhq/live-common/device/use-cases/isSyncOnboardingSupported";

export type SyncOnboardingDeviceConnectionSearchingProps = {
  deviceModelId: DeviceModelId;
};

const SyncOnboardingDeviceConnectionSearching = ({
  deviceModelId,
}: SyncOnboardingDeviceConnectionSearchingProps) => {
  const { t } = useTranslation();
  const deviceModelName = getDeviceModel(deviceModelId).productName;
  const history = useHistory();
  const { setDeviceModelId } = useContext(OnboardingContext);
  const theme = useTheme();
  const currentDevice = useSelector(getCurrentDevice);

  useEffect(() => {
    if (
      currentDevice &&
      currentDevice.modelId !== deviceModelId &&
      !isSyncOnboardingSupported(deviceModelId)
    ) {
      setDeviceModelId(currentDevice.modelId);
      history.replace("/onboarding/select-use-case");
    }
  }, [currentDevice, deviceModelId, history, setDeviceModelId]);

  const handleConnectionTrouble = useCallback(() => {
    setDeviceModelId(deviceModelId);
    history.push("/USBTroubleshooting");
  }, [deviceModelId, history, setDeviceModelId]);

  return (
    <Flex position="relative" height="100%" width="100%" flexDirection="column">
      <OnboardingNavHeader onClickPrevious={() => history.push("/onboarding/select-device")} />
      <Flex flex={1} alignItems="center" justifyContent="center" flexDirection="column">
        <Animation
          animation={getDeviceAnimation(deviceModelId, theme.theme, "plugAndPinCode") as object}
          width={"200px"}
        />
        <Text variant="h3Inter" color="neutral.c100" mt={6} maxWidth={480} textAlign="center">
          {t("syncOnboarding.connection.searching.title", { deviceModelName })}
        </Text>
      </Flex>
      <Link
        position="absolute"
        ml="auto"
        mr="auto"
        left={0}
        right={0}
        bottom={12}
        onClick={handleConnectionTrouble}
        color="neutral.c60"
        type="shade"
        size="large"
      >
        {t("syncOnboarding.connection.searching.connectionTrouble")}
      </Link>
    </Flex>
  );
};

export default SyncOnboardingDeviceConnectionSearching;
