import React, {
  ComponentProps,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { BoxedIcon, Flex, FlowStepper, IconsLegacy, Text } from "@ledgerhq/react-ui";
import { DeviceModelId } from "@ledgerhq/devices";
import { ImageDownloadError } from "@ledgerhq/live-common/customImage/errors";
import {
  isCustomLockScreenSupported,
  CLSSupportedDeviceModelId,
} from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import { ImageBase64Data } from "~/renderer/components/CustomImage/types";
import { CropParams } from "~/renderer/components/CustomImage/ImageCropper";
import { urlContentToDataUri } from "~/renderer/components/CustomImage/shared";
import { ProcessorResult } from "~/renderer/components/CustomImage/ImageGrayscalePreview";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import { withV2StyleProvider } from "~/renderer/styles/StyleProvider";
import StepChooseImage from "./Step1ChooseImage";
import StepAdjustImage from "./Step2AdjustImage";
import StepChooseContrast from "./Step3ChooseContrast";
import StepTransfer from "./Step4Transfer";
import { Step } from "./types";
import StepContainer from "./StepContainer";
import StepFooter from "./StepFooter";
import { analyticsDrawerContext, setDrawer } from "~/renderer/drawers/Provider";
import { useNavigateToPostOnboardingHubCallback } from "~/renderer/components/PostOnboardingHub/logic/useNavigateToPostOnboardingHubCallback";
import { analyticsPageNames, analyticsFlowName, analyticsDrawerName } from "./shared";
import TrackPage, { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { useTrack } from "~/renderer/analytics/segment";
import DeviceModelPicker from "~/renderer/components/CustomImage/DeviceModelPicker";
import { useCompleteActionCallback } from "~/renderer/components/PostOnboardingHub/logic/useCompleteAction";
import RemoveCustomImage from "../manager/DeviceDashboard/DeviceInformationSummary/RemoveCustomImage";

type Props = {
  imageUri?: string;
  isFromNFTEntryPoint?: boolean;
  isFromPostOnboardingEntryPoint?: boolean;
  reopenPreviousDrawer?: () => void;
  deviceModelId: DeviceModelId | null;
  hasCustomLockScreen?: boolean;
  setHasCustomLockScreen?: (value: boolean) => void;
};

const orderedSteps: Step[] = [
  Step.chooseImage,
  Step.adjustImage,
  Step.chooseContrast,
  Step.transferImage,
];

const ErrorDisplayV2 = withV2StyleProvider(ErrorDisplay);

const CustomImage: React.FC<Props> = props => {
  const {
    imageUri,
    isFromNFTEntryPoint,
    reopenPreviousDrawer,
    isFromPostOnboardingEntryPoint,
    hasCustomLockScreen,
    setHasCustomLockScreen,
  } = props;
  const { t } = useTranslation();
  const track = useTrack();
  const { setAnalyticsDrawerName } = useContext(analyticsDrawerContext);

  const isDeviceModelIdUndefined =
    !props.deviceModelId || !isCustomLockScreenSupported(props.deviceModelId);
  const [deviceModelId, setDeviceModelId] = useState<CLSSupportedDeviceModelId>(
    props.deviceModelId && isCustomLockScreenSupported(props.deviceModelId)
      ? props.deviceModelId
      : DeviceModelId.stax,
  );

  useEffect(() => setAnalyticsDrawerName(analyticsDrawerName), [setAnalyticsDrawerName]);

  const [stepError, setStepError] = useState<{ [key in Step]?: Error }>({});

  const [sourceLoading, setSourceLoading] = useState<boolean>(false);
  const [isShowingNftGallery, setIsShowingNftGallery] = useState<boolean>(false);

  const [loadedImage, setLoadedImage] = useState<ImageBase64Data>();
  const [croppedImage, setCroppedImage] = useState<ImageBase64Data>();
  const [finalResult, setFinalResult] = useState<ProcessorResult>();
  const [transferDone, setTransferDone] = useState(false);

  /**
   * Keeping a record of the crop params of a given image so that the cropping
   * state is not lost when unmounting the cropping step component.
   * */
  const [initialCropParams, setInitialCropParams] = useState<CropParams>();

  const [step, setStep] = useState<Step>(Step.chooseImage);

  const exit = useCallback(() => {
    setDrawer();
    if (reopenPreviousDrawer) reopenPreviousDrawer();
  }, [reopenPreviousDrawer]);

  const setStepWrapper = useCallback(
    (newStep: Step) => {
      if (step === Step.adjustImage && newStep === Step.chooseImage && isFromNFTEntryPoint) {
        exit();
        return;
      }
      setStepError({});
      setStep(newStep);
    },
    [step, isFromNFTEntryPoint, exit],
  );

  const initialUri = imageUri;

  useEffect(() => {
    let dead = false;
    if (initialUri && step === Step.chooseImage && !loadedImage) {
      setSourceLoading(true);
      urlContentToDataUri(initialUri)
        .then(res => {
          if (dead) return;
          setLoadedImage({ imageBase64DataUri: res });
          setStepWrapper(Step.adjustImage);
        })
        .catch(e => {
          console.error(e);
          if (dead) return;
          setStepError({ [Step.chooseImage]: new ImageDownloadError() });
        });
    }
    return () => {
      dead = true;
    };
  }, [setLoadedImage, loadedImage, initialUri, setStepWrapper, step]);

  useEffect(() => {
    if (loadedImage) setSourceLoading(false);
  }, [loadedImage]);

  const handleStepChooseImageResult: ComponentProps<typeof StepChooseImage>["onResult"] =
    useCallback(
      res => {
        setLoadedImage(res);
        setStepWrapper(Step.adjustImage);
      },
      [setStepWrapper],
    );

  const handleStepAdjustImageResult: ComponentProps<typeof StepAdjustImage>["onResult"] =
    useCallback(res => {
      setCroppedImage(res);
    }, []);

  const handleStepChooseContrastResult: ComponentProps<typeof StepChooseContrast>["onResult"] =
    useCallback(res => {
      setFinalResult(res);
    }, []);

  const handleStepTransferResult = useCallback(() => {
    setHasCustomLockScreen && setHasCustomLockScreen(true);
    setTransferDone(true);
  }, [setHasCustomLockScreen]);

  const handleError = useCallback(
    (step: Step, error: Error) => {
      setStepError({ [step]: error });
    },
    [setStepError],
  );

  /** just avoiding creating a new ref (and rerendering) for each step's onError */
  const errorHandlers: { [key in Step]: (error: Error) => void } = useMemo(
    () => ({
      [Step.adjustImage]: (...args) => handleError(Step.adjustImage, ...args),
      [Step.chooseContrast]: (...args) => handleError(Step.chooseContrast, ...args),
      [Step.chooseImage]: (...args) => handleError(Step.chooseImage, ...args),
      [Step.transferImage]: (...args) => handleError(Step.transferImage, ...args),
    }),
    [handleError],
  );

  const error = stepError[step];

  const handleErrorRetryClicked = useCallback(() => {
    error?.name && track("button_clicked2", { button: "Retry" });
    setStepWrapper(Step.chooseImage);
  }, [error?.name, setStepWrapper, track]);

  const previousStep: Step | undefined = orderedSteps[orderedSteps.findIndex(s => s === step) - 1];

  const openPostOnboarding = useNavigateToPostOnboardingHubCallback();
  const completeAction = useCompleteActionCallback();

  const handleDone = useCallback(() => {
    exit();
    completeAction(PostOnboardingActionId.customImage);
    if (isFromPostOnboardingEntryPoint) {
      setTrackingSource(analyticsPageNames.success);
      openPostOnboarding();
    }
  }, [exit, completeAction, isFromPostOnboardingEntryPoint, openPostOnboarding]);

  const renderError = useMemo(
    () =>
      error
        ? () => {
            return (
              <StepContainer
                footer={
                  <StepFooter
                    previousStep={previousStep}
                    previousLabel={t("common.previous")}
                    setStep={setStepWrapper}
                    previousEventProperties={{
                      button: "Previous",
                    }}
                  />
                }
              >
                <TrackPage
                  category={analyticsPageNames.error + error.name}
                  type="drawer"
                  flow={analyticsFlowName}
                  refreshSource={false}
                />
                <ErrorDisplayV2 error={error} onRetry={handleErrorRetryClicked} />
              </StepContainer>
            );
          }
        : undefined,
    [error, previousStep, t, setStepWrapper, handleErrorRetryClicked],
  );

  const deviceModelPicker = isDeviceModelIdUndefined ? (
    <DeviceModelPicker deviceModelId={deviceModelId} onChange={setDeviceModelId} />
  ) : null;

  const [isShowingRemoveCustomImage, setIsShowingRemoveCustomImage] = useState(false);
  const onClickRemoveCustomImage = useCallback(() => {
    setIsShowingRemoveCustomImage(true);
  }, []);

  if (isShowingRemoveCustomImage) {
    return (
      <RemoveCustomImage
        onClose={() => setDrawer()}
        onRemoved={setHasCustomLockScreen ? () => setHasCustomLockScreen(false) : undefined}
      />
    );
  }

  return (
    <Flex
      flexDirection="column"
      rowGap={5}
      height="100%"
      overflowY="hidden"
      width="100%"
      flex={1}
      data-testid="custom-image-container"
    >
      <Text alignSelf="center" variant="h5Inter">
        {t("customImage.title")}
      </Text>
      {!transferDone ? (
        <FlowStepper.Indexed
          activeKey={step}
          extraStepperProps={{ errored: !!error }}
          extraStepperContainerProps={{ px: 12 }}
          extraContainerProps={{ overflowY: "hidden" }}
          extraChildrenContainerProps={{ overflowY: "hidden" }}
          renderChildren={renderError}
        >
          <FlowStepper.Indexed.Step
            itemKey={Step.chooseImage}
            label={t("customImage.steps.choose.stepLabel")}
          >
            <StepChooseImage
              onError={errorHandlers[Step.chooseImage]}
              onResult={handleStepChooseImageResult}
              setStep={setStepWrapper}
              loading={sourceLoading}
              setLoading={setSourceLoading}
              isShowingNftGallery={isShowingNftGallery}
              setIsShowingNftGallery={setIsShowingNftGallery}
              hasCustomLockScreen={hasCustomLockScreen}
              onClickRemoveCustomImage={onClickRemoveCustomImage}
            />
          </FlowStepper.Indexed.Step>
          <FlowStepper.Indexed.Step
            itemKey={Step.adjustImage}
            label={t("customImage.steps.adjust.stepLabel")}
          >
            <StepAdjustImage
              src={loadedImage}
              deviceModelId={deviceModelId}
              onError={errorHandlers[Step.adjustImage]}
              onResult={handleStepAdjustImageResult}
              setStep={setStepWrapper}
              initialCropParams={initialCropParams}
              setCropParams={setInitialCropParams}
              deviceModelPicker={deviceModelPicker}
            />
          </FlowStepper.Indexed.Step>
          <FlowStepper.Indexed.Step
            itemKey={Step.chooseContrast}
            label={t("customImage.steps.contrast.stepLabel")}
          >
            <StepChooseContrast
              deviceModelId={deviceModelId}
              src={croppedImage}
              onResult={handleStepChooseContrastResult}
              onError={errorHandlers[Step.chooseContrast]}
              setStep={setStepWrapper}
            />
          </FlowStepper.Indexed.Step>
          <FlowStepper.Indexed.Step
            itemKey={Step.transferImage}
            label={t("customImage.steps.transfer.stepLabel")}
          >
            <StepTransfer
              deviceModelId={deviceModelId}
              result={finalResult}
              onError={errorHandlers[Step.transferImage]}
              setStep={setStepWrapper}
              onResult={handleStepTransferResult}
              onExit={exit}
            />
          </FlowStepper.Indexed.Step>
        </FlowStepper.Indexed>
      ) : (
        <StepContainer
          footer={
            <StepFooter
              nextLabel={t("customImage.finishCTA")}
              setStep={setStepWrapper}
              onClickNext={handleDone}
              nextTestId="custom-image-finish-button"
              nextEventProperties={{ button: "Finish" }}
            />
          }
        >
          <TrackPage
            category={analyticsPageNames.success}
            type="drawer"
            flow={analyticsFlowName}
            refreshSource={false}
          />
          <Flex flex={1} flexDirection="column" justifyContent="center" alignItems="center">
            <BoxedIcon
              Icon={IconsLegacy.CheckAloneMedium}
              iconColor="success.c60"
              size={64}
              iconSize={24}
            />
            <Text variant="h5Inter" alignSelf="stretch" mt={9} textAlign="center">
              {t("customImage.customImageSet")}
            </Text>
          </Flex>
        </StepContainer>
      )}
    </Flex>
  );
};

export default withV3StyleProvider(CustomImage);
