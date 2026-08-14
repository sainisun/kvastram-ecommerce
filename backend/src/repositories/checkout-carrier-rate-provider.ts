import { carrierService } from '../services/carrier-service';
import type { CheckoutCarrierRateProvider } from '../application/checkout/shipping-resolution-contracts';

export class CarrierServiceCheckoutRateProvider
  implements CheckoutCarrierRateProvider
{
  async getRates(input: Parameters<CheckoutCarrierRateProvider['getRates']>[0]) {
    return carrierService.getRates(input);
  }
}
