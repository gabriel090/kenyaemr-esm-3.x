import React from 'react';
import { Button } from '@carbon/react';
import { navigate, showSnackbar } from '@openmrs/esm-framework';
import { useTranslation } from 'react-i18next';
import { CardHeader } from '@openmrs/esm-patient-common-lib';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { convertToCurrency } from '../../helpers';
import { InvoiceBreakDown } from './invoice-breakdown/invoice-breakdown.component';
import { MappedBill } from '../../types';
import PaymentHistory from './payment-history/payment-history.component';
import styles from './payments.scss';
import PaymentForm from './payment-form/payment-form.component';
import { createPaymentPayload } from './utils';
import { processBillPayment } from '../../billing.resource';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const paymentSchema = z.object({
  method: z.string().refine((value) => !!value, 'Payment method is required'),
  amount: z.union([
    z.number().refine((value) => !!value, 'Amount is required'),
    z.string().refine((value) => !!value, 'Amount is required'),
  ]),
  referenceCode: z.union([z.number(), z.string()]).optional(),
});
const paymentFormSchema = z.object({ payment: z.array(paymentSchema) });

type PaymentProps = { bill: MappedBill };
export type Payment = { method: string; amount: string | number; referenceCode?: number | string };
export type PaymentFormValue = {
  payment: Array<Payment>;
};

const Payments: React.FC<PaymentProps> = ({ bill }) => {
  const { t } = useTranslation();
  const methods = useForm<PaymentFormValue>({
    mode: 'all',
    defaultValues: {},
    resolver: zodResolver(paymentFormSchema),
  });

  const formValues = useWatch({
    name: 'payment',
    control: methods.control,
  });

  const totalAmountTendered = formValues?.reduce((curr: number, prev) => curr + Number(prev.amount) ?? 0, 0) ?? 0;
  const amountDue = Number(bill.totalAmount) - (Number(bill.tenderedAmount) + Number(totalAmountTendered));
  const handleNavigateToBillingDashboard = () =>
    navigate({
      to: window.getOpenmrsSpaBase() + 'home/billing',
    });

  const handleProcessPayment = () => {
    const paymentPayload = createPaymentPayload(bill, bill.patientUuid, formValues, amountDue);
    processBillPayment(paymentPayload, bill.uuid).then(
      (resp) => {
        showSnackbar({
          title: t('Bill payment'),
          subtitle: 'Bill payment processing has been successful',
          kind: 'success',
          timeoutInMs: 3000,
        });
        handleNavigateToBillingDashboard();
      },
      (error) => {
        showSnackbar({ title: 'Bill payment error', kind: 'error', subtitle: error });
      },
    );
  };

  return (
    <FormProvider {...methods}>
      <div className={styles.wrapper}>
        <div className={styles.paymentContainer}>
          <CardHeader title={t('payments', 'Payments')}>
            <span></span>
          </CardHeader>
          <div>
            {bill && <PaymentHistory bill={bill} />}
            <PaymentForm disablePayment={amountDue <= 0} />
          </div>
        </div>
        <div className={styles.paymentTotals}>
          <InvoiceBreakDown label={t('totalAmount', 'Total Amount')} value={convertToCurrency(bill.totalAmount)} />
          <InvoiceBreakDown
            label={t('totalTendered', 'Total Tendered')}
            value={convertToCurrency(bill.tenderedAmount + totalAmountTendered ?? 0)}
          />
          <InvoiceBreakDown label={t('discount', 'Discount')} value={'--'} />
          <InvoiceBreakDown label={t('amountDue', 'Amount due')} value={convertToCurrency(amountDue ?? 0)} />
        </div>
      </div>
      <div className={styles.processPayments}>
        <Button onClick={handleNavigateToBillingDashboard} kind="danger">
          {t('discardPayment', 'Discard Payment')}
        </Button>
        <Button onClick={() => handleProcessPayment()} disabled={!formValues?.length || !methods.formState.isValid}>
          {t('processPayment', 'Process Payment')}
        </Button>
      </div>
    </FormProvider>
  );
};

export default Payments;
