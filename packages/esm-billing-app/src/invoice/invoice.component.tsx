import React, { useEffect, useRef, useState } from 'react';
import { Button, InlineLoading } from '@carbon/react';
import { ArrowLeft, Printer } from '@carbon/react/icons';
import { ExtensionSlot, isDesktop, navigate, useLayoutType, usePatient } from '@openmrs/esm-framework';
import { useParams } from 'react-router-dom';
import styles from './invoice.scss';
import InvoiceTable from './invoice-table.component';
import Payments from './payments/payments.component';
import { useBill } from '../billing.resource';
import { convertToCurrency } from '../helpers';
import { ErrorState } from '@openmrs/esm-patient-common-lib';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import PrintableInvoice from './printable-invoice/printable-invoice.component';

type InvoiceProps = {};

const Invoice: React.FC<InvoiceProps> = () => {
  const { t } = useTranslation();
  const params = useParams();
  const { patient, patientUuid, isLoading } = usePatient(params?.patientUuid);
  const { bill, isLoading: isLoadingBilling, error } = useBill(params?.billUuid);
  const [isPrinting, setIsPrinting] = useState(false);
  const contentToPrintRef = useRef(null);
  const onBeforeGetContentResolve = useRef(null);

  const handlePrint = useReactToPrint({
    content: () => contentToPrintRef.current,
    documentTitle: `Invoice ${bill?.receiptNumber} - ${patient?.name?.[0]?.given?.join(' ')} ${
      patient?.name?.[0].family
    }`,
    onBeforeGetContent: () =>
      new Promise((resolve) => {
        if (patient && bill) {
          onBeforeGetContentResolve.current = resolve;
          setIsPrinting(true);
        }
      }),
    onAfterPrint: () => {
      onBeforeGetContentResolve.current = null;
      setIsPrinting(false);
    },
  });

  useEffect(() => {
    if (isPrinting && onBeforeGetContentResolve.current) {
      onBeforeGetContentResolve.current();
    }
  }, [isPrinting]);

  const invoiceDetails = {
    'Total Amount': convertToCurrency(bill?.totalAmount),
    'Amount Tendered': convertToCurrency(bill?.tenderedAmount),
    'Invoice Number': bill.receiptNumber,
    'Date And Time': bill?.dateCreated,
    'Invoice Status': bill?.status,
  };

  if (isLoading && isLoadingBilling) {
    return (
      <div className={styles.invoiceContainer}>
        <InlineLoading
          className={styles.loader}
          status="active"
          iconDescription="Loading"
          description="Loading patient header..."
        />
      </div>
    );
  }

  if (error) {
    return <ErrorState headerTitle={t('invoiceError', 'Invoice error')} error={error} />;
  }

  return (
    <div className={styles.invoiceContainer}>
      {patient && patientUuid && <ExtensionSlot name="patient-header-slot" state={{ patient, patientUuid }} />}
      <section className={styles.details}>
        {Object.entries(invoiceDetails).map(([key, val]) => (
          <InvoiceDetails key={key} label={key} value={val} />
        ))}
        <Button
          onClick={handlePrint}
          renderIcon={(props) => <Printer size={24} {...props} />}
          iconDescription="Print bill"
          size="md">
          {t('printBill', 'Print bill')}
        </Button>
      </section>

      <div>
        <InvoiceTable billUuid={bill?.uuid} />
        {bill && <Payments bill={bill} />}
      </div>

      <div ref={contentToPrintRef} className={isPrinting === true ? '' : styles.printContainer}>
        <PrintableInvoice bill={bill} patient={patient} isLoading={isLoading} />
      </div>
    </div>
  );
};

interface InvoiceDetailsProps {
  label: string;
  value: string | number;
}

function InvoiceDetails({ label, value }: InvoiceDetailsProps) {
  return (
    <div>
      <h1 className={styles.label}>{label}</h1>
      <span className={styles.value}>{value}</span>
    </div>
  );
}

export default Invoice;
