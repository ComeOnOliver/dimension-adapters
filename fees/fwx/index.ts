import { Chain } from "@defillama/sdk/build/general";
import { Adapter, FetchResultFees } from "../../adapters/types";
import { CHAIN } from "../../helpers/chains";
import { getUniqStartOfTodayTimestamp } from "../../helpers/getUniSubgraphVolume";
import { httpPost } from "../../utils/fetchURL";

interface IDailyFeeData {
  daily_interest_paid: string;
  daily_trading_fee: string;
  daily_otf_fee: string;
  daily_bounty_fee_to_protocol: string;
  daily_bounty_fee_to_liquidator: string;
  daily_liquidation_fee: string;
  total_interest_paid: string;
  total_trading_fee: string;
  total_otf_fee: string;
  total_bounty_fee_to_protocol: string;
  total_bounty_fee_to_liquidator: string;
  total_liquidation_fee: string;
}

const endpoints = {
  dailyFees: "https://analytics.fwx.finance/api/fees",
};

const CHAIN_ID = {
  [CHAIN.AVAX]: 43114,
  [CHAIN.BASE]: 8453,
};

const fetch = (chain: Chain) => {
  return async (timestamp: number): Promise<FetchResultFees> => {
    const dayTimestamp = getUniqStartOfTodayTimestamp(
      new Date(timestamp * 1e3)
    );
    const date = new Date(dayTimestamp * 1e3);
    const formattedDate = date.toISOString().replace(/\.(\d{3})Z$/, ".$1Z");

    // * call api for daily fees and revenue
    const marginTradeRes = await httpPost(endpoints.dailyFees, {
      date: formattedDate,
      chain_id: CHAIN_ID[chain],
      is_perp: false,
    });
    const marginTradeResData = marginTradeRes as IDailyFeeData;

    const perpRes = await httpPost(endpoints.dailyFees, {
      date: formattedDate,
      chain_id: CHAIN_ID[chain],
      is_perp: true,
    });
    const perpResData = perpRes as IDailyFeeData;

    const dailyInterestPaid =
      parseFloat(marginTradeResData.daily_interest_paid) +
      parseFloat(perpResData.daily_interest_paid);
    const dailyTradingFee =
      parseFloat(marginTradeResData.daily_trading_fee) +
      parseFloat(perpResData.daily_trading_fee);
    const dailyOtfFee =
      parseFloat(marginTradeResData.daily_otf_fee) +
      parseFloat(perpResData.daily_otf_fee);
    const dailyBountyFeeToProtocol =
      parseFloat(marginTradeResData.daily_bounty_fee_to_protocol) +
      parseFloat(perpResData.daily_bounty_fee_to_protocol);
    const dailyBountyFeeToLiquidator =
      parseFloat(marginTradeResData.daily_bounty_fee_to_liquidator) +
      parseFloat(perpResData.daily_bounty_fee_to_liquidator);
    const dailyLiquidationFee =
      parseFloat(marginTradeResData.daily_liquidation_fee) +
      parseFloat(perpResData.daily_liquidation_fee);
    const totalInterestPaid =
      parseFloat(marginTradeResData.total_interest_paid) +
      parseFloat(perpResData.total_interest_paid);
    const totalTradingFee =
      parseFloat(marginTradeResData.total_trading_fee) +
      parseFloat(perpResData.total_trading_fee);
    const totalOtfFee =
      parseFloat(marginTradeResData.total_otf_fee) +
      parseFloat(perpResData.total_otf_fee);
    const totalBountyFeeToProtocol =
      parseFloat(marginTradeResData.total_bounty_fee_to_protocol) +
      parseFloat(perpResData.total_bounty_fee_to_protocol);
    const totalBountyFeeToLiquidator =
      parseFloat(marginTradeResData.total_bounty_fee_to_liquidator) +
      parseFloat(perpResData.total_bounty_fee_to_liquidator);
    const totalLiquidationFee =
      parseFloat(marginTradeResData.total_liquidation_fee) +
      parseFloat(perpResData.total_liquidation_fee);

    const dailyFees =
      dailyInterestPaid +
      dailyTradingFee +
      dailyLiquidationFee +
      dailyBountyFeeToLiquidator +
      dailyBountyFeeToProtocol +
      dailyOtfFee;
    const dailySupplySideRevenue =
      0.1 * dailyInterestPaid +
      0.8 * dailyTradingFee +
      dailyBountyFeeToProtocol +
      dailyOtfFee;
    const dailyProtocolRevenue =
      0.9 * dailyInterestPaid + 0.2 * dailyTradingFee;
    const totalFees =
      totalInterestPaid +
      totalTradingFee +
      totalLiquidationFee +
      totalBountyFeeToLiquidator +
      totalBountyFeeToProtocol;
    const totalSupplySideRevenue =
      0.1 * totalInterestPaid +
      0.8 * totalTradingFee +
      totalBountyFeeToProtocol +
      totalOtfFee;
    const totalProtocolRevenue =
      0.9 * totalInterestPaid + 0.2 * totalTradingFee;

    return {
      timestamp,
      dailyFees: dailyFees,
      dailyRevenue: dailyProtocolRevenue + dailySupplySideRevenue,
      dailyProtocolRevenue: dailyProtocolRevenue,
      dailySupplySideRevenue: dailySupplySideRevenue,
      totalFees: totalFees,
      totalRevenue: totalProtocolRevenue + totalSupplySideRevenue,
      totalProtocolRevenue: totalProtocolRevenue,
      totalSupplySideRevenue: totalSupplySideRevenue,
    };
  };
};

const adapter: Adapter = {
  adapter: {
    [CHAIN.AVAX]: {
      fetch: fetch(CHAIN.AVAX),
      start: 1701907200,
    },
    [CHAIN.BASE]: {
      fetch: fetch(CHAIN.BASE),
      start: 1725408000,
    },
  },
  version: 1,
};
export default adapter;
