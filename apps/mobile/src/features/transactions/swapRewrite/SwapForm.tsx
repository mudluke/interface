import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, StyleSheet, TextInputProps, TouchableWithoutFeedback } from 'react-native'
import {
  FadeIn,
  FadeOut,
  FadeOutDown,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useBottomSheetContext } from 'src/components/modals/BottomSheetContext'
import { HandleBar } from 'src/components/modals/HandleBar'
import Trace from 'src/components/Trace/Trace'
import { IS_ANDROID } from 'src/constants/globals'
import { ElementName, SectionName } from 'src/features/telemetry/constants'
import { useShouldShowNativeKeyboard } from 'src/features/transactions/hooks'
import {
  useShowSwapNetworkNotification,
  useSwapTxAndGasInfo,
} from 'src/features/transactions/swap/hooks'
import { isWrapAction } from 'src/features/transactions/swap/utils'
import { CurrencyInputPanel } from 'src/features/transactions/swapRewrite/CurrencyInputPanel'
import { DecimalPadInput } from 'src/features/transactions/swapRewrite/DecimalPadInput'
import { GasAndWarningRows } from 'src/features/transactions/swapRewrite/GasAndWarningRows'
import { useParsedSwapWarnings } from 'src/features/transactions/swapRewrite/hooks/useParsedSwapWarnings'
import { SwapArrowButton } from 'src/features/transactions/swapRewrite/SwapArrowButton'
import { useWalletRestore } from 'src/features/wallet/hooks'
import { AnimatedFlex, Button, Flex, Icons, Text, TouchableArea, useSporeColors } from 'ui/src'
import { iconSizes, spacing } from 'ui/src/theme'
import { formatCurrencyAmount, NumberType } from 'utilities/src/format/format'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { createTransactionId } from 'wallet/src/features/transactions/utils'
import { useIsBlockedActiveAddress } from 'wallet/src/features/trm/hooks'
import { SwapScreen, useSwapContext } from './SwapContext'
import { SwapFormHeader } from './SwapFormHeader'
import { TokenSelector } from './TokenSelector'

const SWAP_DIRECTION_BUTTON_SIZE = iconSizes.icon24
const SWAP_DIRECTION_BUTTON_INNER_PADDING = spacing.spacing8 + spacing.spacing2
const SWAP_DIRECTION_BUTTON_BORDER_WIDTH = spacing.spacing4

export function SwapForm(): JSX.Element {
  const { selectingCurrencyField } = useSwapContext()

  const { isSheetReady } = useBottomSheetContext()

  const insets = useSafeAreaInsets()

  const screenXOffset = useSharedValue(0)

  const wrapperStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: screenXOffset.value }],
  }))

  return (
    <>
      <TouchableWithoutFeedback>
        <Flex mt={insets.top}>
          <HandleBar backgroundColor="none" />
          <AnimatedFlex grow row height="100%" style={wrapperStyle}>
            <Flex
              gap="$spacing16"
              pb={IS_ANDROID ? '$spacing32' : '$spacing16'}
              px="$spacing16"
              style={{ marginBottom: insets.bottom }}
              width="100%">
              <SwapFormHeader />
              {isSheetReady && <SwapFormContent />}
            </Flex>
          </AnimatedFlex>
        </Flex>
      </TouchableWithoutFeedback>

      {!!selectingCurrencyField && <TokenSelector />}
    </>
  )
}

// eslint-disable-next-line complexity
function SwapFormContent(): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const {
    derivedSwapInfo,
    exactAmountFiat,
    exactAmountFiatRef,
    exactAmountToken,
    exactAmountTokenRef,
    exactCurrencyField,
    focusOnCurrencyField,
    input,
    isFiatInput,
    output,
    updateSwapForm,
  } = useSwapContext()

  const {
    currencyAmounts,
    currencyBalances,
    currencies,
    currencyAmountsUSDValue,
    chainId,
    wrapType,
    trade,
  } = derivedSwapInfo

  useShowSwapNetworkNotification(chainId)

  // TODO: remove this if we don't need it.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { txRequest, approveTxRequest, gasFee } = useSwapTxAndGasInfo({
    derivedSwapInfo,
    skipGasFeeQuery: false,
  })

  const { isBlocked, isBlockedLoading } = useIsBlockedActiveAddress()

  const { walletNeedsRestore, openWalletRestoreModal } = useWalletRestore()

  const onRestorePress = (): void => {
    Keyboard.dismiss()
    openWalletRestoreModal()
  }

  const noValidSwap = !isWrapAction(wrapType) && !trade.trade

  const parsedWarnings = useParsedSwapWarnings({
    derivedSwapInfo,
    gasFee,
    t,
  })

  const { blockingWarning, mainWarning } = parsedWarnings

  // Quote is being fetched for first time
  const isSwapDataLoading = !isWrapAction(wrapType) && trade.loading

  const reviewButtonDisabled =
    isSwapDataLoading ||
    noValidSwap ||
    !!blockingWarning ||
    isBlocked ||
    isBlockedLoading ||
    walletNeedsRestore

  const { showNativeKeyboard, onDecimalPadLayout, isLayoutPending, onInputPanelLayout } =
    useShouldShowNativeKeyboard()

  const inputSelectionRef = useRef<TextInputProps['selection']>()
  const outputSelectionRef = useRef<TextInputProps['selection']>()

  const selection = useMemo(
    () => ({
      [CurrencyField.INPUT]: inputSelectionRef,
      [CurrencyField.OUTPUT]: outputSelectionRef,
    }),
    [inputSelectionRef, outputSelectionRef]
  )

  const resetSelection = useCallback(
    (start: number, end?: number) => {
      if (focusOnCurrencyField === CurrencyField.INPUT) {
        inputSelectionRef.current = { start, end: end ?? start }
      } else if (focusOnCurrencyField === CurrencyField.OUTPUT) {
        outputSelectionRef.current = { start, end: end ?? start }
      }
    },
    [focusOnCurrencyField]
  )

  const decimalPadSetValue = useCallback(
    (value: string): void => {
      if (!focusOnCurrencyField) {
        return
      }

      updateSwapForm({
        exactAmountFiat: isFiatInput ? value : undefined,
        exactAmountToken: !isFiatInput ? value : undefined,
        exactCurrencyField: focusOnCurrencyField,
      })
    },
    [focusOnCurrencyField, isFiatInput, updateSwapForm]
  )

  const onInputSelectionChange = useCallback(
    (start: number, end: number) => (inputSelectionRef.current = { start, end }),
    []
  )
  const onOutputSelectionChange = useCallback(
    (start: number, end: number) => (outputSelectionRef.current = { start, end }),
    []
  )

  const onFocusInput = useCallback(
    (): void => updateSwapForm({ focusOnCurrencyField: CurrencyField.INPUT }),
    [updateSwapForm]
  )

  const onFocusOutput = useCallback(
    (): void => updateSwapForm({ focusOnCurrencyField: CurrencyField.OUTPUT }),
    [updateSwapForm]
  )

  const onShowTokenSelectorInput = useCallback(
    (): void => updateSwapForm({ selectingCurrencyField: CurrencyField.INPUT }),
    [updateSwapForm]
  )

  const onShowTokenSelectorOutput = useCallback(
    (): void => updateSwapForm({ selectingCurrencyField: CurrencyField.OUTPUT }),
    [updateSwapForm]
  )

  const onSetExactAmountInput = useCallback(
    (amount: string): void =>
      isFiatInput
        ? updateSwapForm({ exactAmountFiat: amount, exactCurrencyField: CurrencyField.INPUT })
        : updateSwapForm({ exactAmountToken: amount, exactCurrencyField: CurrencyField.INPUT }),
    [isFiatInput, updateSwapForm]
  )

  const onSetExactAmountOutput = useCallback(
    (amount: string): void =>
      isFiatInput
        ? updateSwapForm({ exactAmountFiat: amount, exactCurrencyField: CurrencyField.OUTPUT })
        : updateSwapForm({ exactAmountToken: amount, exactCurrencyField: CurrencyField.OUTPUT }),
    [isFiatInput, updateSwapForm]
  )

  const onSetMax = useCallback(
    (amount: string): void => {
      updateSwapForm({
        exactAmountFiat: undefined,
        exactAmountToken: amount,
        exactCurrencyField: CurrencyField.INPUT,
        focusOnCurrencyField: exactCurrencyField,
      })
    },
    [exactCurrencyField, updateSwapForm]
  )

  const onSwitchCurrencies = useCallback(() => {
    updateSwapForm({
      exactCurrencyField:
        exactCurrencyField === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT,
      focusOnCurrencyField: exactCurrencyField,
      input: output,
      output: input,
    })
  }, [exactCurrencyField, input, output, updateSwapForm])

  const derivedCurrencyField =
    exactCurrencyField === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT

  const formattedDerivedValue = formatCurrencyAmount(
    currencyAmounts[derivedCurrencyField],
    NumberType.SwapTradeAmount,
    ''
  )

  // TODO - improve this to update ref when calculating the derived state
  // instead of assigning ref based on the derived state
  const formattedDerivedValueRef = useRef(formattedDerivedValue)
  useEffect(() => {
    formattedDerivedValueRef.current = formattedDerivedValue
  }, [formattedDerivedValue])

  const exactValue = isFiatInput ? exactAmountFiat : exactAmountToken
  const exactValueRef = isFiatInput ? exactAmountFiatRef : exactAmountTokenRef

  const onReview = useCallback(() => {
    updateSwapForm({
      screen: SwapScreen.SwapReview,
      txId: createTransactionId(),
    })
  }, [updateSwapForm])

  return (
    <Flex grow gap="$spacing8" justifyContent="space-between">
      <AnimatedFlex
        entering={FadeIn}
        exiting={FadeOut}
        gap="$spacing2"
        onLayout={onInputPanelLayout}>
        <Trace section={SectionName.CurrencyInputPanel}>
          <Flex
            backgroundColor={
              focusOnCurrencyField === CurrencyField.INPUT ? '$surface1' : '$surface2'
            }
            borderColor="$surface3"
            borderRadius="$rounded20"
            borderWidth={1}>
            <CurrencyInputPanel
              currencyAmount={currencyAmounts[CurrencyField.INPUT]}
              currencyBalance={currencyBalances[CurrencyField.INPUT]}
              currencyInfo={currencies[CurrencyField.INPUT]}
              dimTextColor={exactCurrencyField === CurrencyField.OUTPUT && isSwapDataLoading}
              focus={focusOnCurrencyField === CurrencyField.INPUT}
              parsedWarnings={parsedWarnings}
              showSoftInputOnFocus={showNativeKeyboard}
              usdValue={currencyAmountsUSDValue[CurrencyField.INPUT]}
              value={
                exactCurrencyField === CurrencyField.INPUT ? exactValue : formattedDerivedValue
              }
              onPressIn={onFocusInput}
              onSelectionChange={showNativeKeyboard ? undefined : onInputSelectionChange}
              onSetExactAmount={onSetExactAmountInput}
              onSetMax={onSetMax}
              onShowTokenSelector={onShowTokenSelectorInput}
            />
          </Flex>
        </Trace>

        <Flex zIndex="$popover">
          <Flex alignItems="center" height={0} style={StyleSheet.absoluteFill}>
            <Flex
              alignItems="center"
              bottom={
                -(
                  // (icon size + (top + bottom padding) + (top + bottom border)) / 2
                  // to center the swap direction button vertically
                  (
                    SWAP_DIRECTION_BUTTON_SIZE +
                    SWAP_DIRECTION_BUTTON_INNER_PADDING * 2 +
                    SWAP_DIRECTION_BUTTON_BORDER_WIDTH * 2
                  )
                ) / 2
              }
              position="absolute">
              <Trace logPress element={ElementName.SwitchCurrenciesButton}>
                <SwapArrowButton
                  bg="$surface1"
                  size={SWAP_DIRECTION_BUTTON_SIZE}
                  onPress={onSwitchCurrencies}
                />
              </Trace>
            </Flex>
          </Flex>
        </Flex>

        <Trace section={SectionName.CurrencyOutputPanel}>
          <Flex>
            <Flex
              backgroundColor={
                focusOnCurrencyField === CurrencyField.OUTPUT ? '$surface1' : '$surface2'
              }
              borderBottomLeftRadius={
                // TODO: maybe add this.
                //swapWarning || showRate || isBlocked ? '$none' : '$rounded20'
                '$rounded20'
              }
              borderBottomRightRadius={
                // TODO: maybe add this.
                // swapWarning || showRate || isBlocked ? '$none' : '$rounded20'
                '$rounded20'
              }
              borderColor="$surface3"
              borderRadius="$rounded20"
              borderWidth={1}
              overflow="hidden"
              position="relative">
              <CurrencyInputPanel
                isOutput
                currencyAmount={currencyAmounts[CurrencyField.OUTPUT]}
                currencyBalance={currencyBalances[CurrencyField.OUTPUT]}
                currencyInfo={currencies[CurrencyField.OUTPUT]}
                dimTextColor={exactCurrencyField === CurrencyField.INPUT && isSwapDataLoading}
                focus={focusOnCurrencyField === CurrencyField.OUTPUT}
                parsedWarnings={parsedWarnings}
                showNonZeroBalancesOnly={false}
                showSoftInputOnFocus={showNativeKeyboard}
                usdValue={currencyAmountsUSDValue[CurrencyField.OUTPUT]}
                value={
                  exactCurrencyField === CurrencyField.OUTPUT ? exactValue : formattedDerivedValue
                }
                onPressIn={onFocusOutput}
                onSelectionChange={showNativeKeyboard ? undefined : onOutputSelectionChange}
                onSetExactAmount={onSetExactAmountOutput}
                onShowTokenSelector={onShowTokenSelectorOutput}
              />
              {walletNeedsRestore && (
                <TouchableArea onPress={onRestorePress}>
                  <Flex
                    grow
                    row
                    alignItems="center"
                    alignSelf="stretch"
                    backgroundColor="$surface2"
                    borderBottomLeftRadius="$rounded16"
                    borderBottomRightRadius="$rounded16"
                    borderTopColor="$surface1"
                    borderTopWidth={1}
                    gap="$spacing8"
                    px="$spacing12"
                    py="$spacing12">
                    <Icons.InfoCircleFilled color={colors.DEP_accentWarning.val} size="$icon.20" />
                    <Text color="$DEP_accentWarning" variant="subheading2">
                      {t('Restore your wallet to swap')}
                    </Text>
                  </Flex>
                </TouchableArea>
              )}
            </Flex>
          </Flex>
        </Trace>

        <GasAndWarningRows gasFee={gasFee} mainWarning={mainWarning} />
      </AnimatedFlex>

      <AnimatedFlex
        bottom={0}
        exiting={FadeOutDown}
        gap="$spacing8"
        left={0}
        opacity={isLayoutPending ? 0 : 1}
        position="absolute"
        right={0}
        onLayout={onDecimalPadLayout}>
        {!showNativeKeyboard && (
          <DecimalPadInput
            resetSelection={resetSelection}
            selectionRef={focusOnCurrencyField ? selection[focusOnCurrencyField] : undefined}
            setValue={decimalPadSetValue}
            valueRef={
              focusOnCurrencyField === exactCurrencyField ? exactValueRef : formattedDerivedValueRef
            }
          />
        )}
        <Trace logPress element={ElementName.SwapReview}>
          <Button
            disabled={reviewButtonDisabled}
            size="large"
            testID={ElementName.ReviewSwap}
            onPress={onReview}>
            {t('Review swap')}
          </Button>
        </Trace>
      </AnimatedFlex>
    </Flex>
  )
}