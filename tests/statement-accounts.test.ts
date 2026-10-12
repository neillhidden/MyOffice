import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statementAccountMatch } from '../src/utils/statementAccounts';
import { emptyHome, validateHomeData } from '../src/utils/home';
import { formatForeignCurrency, formatKwanza } from '../src/utils/formatters';
const accounts = [{ id: 'one', accountNumber: '123.456.789', iban: 'AO06123456789012345678901' }, { id: 'two', accountNumber: '987654321' }];
test('statement ownership requires a labelled exact unique identifier, never a description substring', () => {
 assert.equal(statementAccountMatch('Conta: 123 456 789', accounts).accountId, 'one');
 assert.equal(statementAccountMatch('IBAN: AO06 1234 5678 9012 3456 7890 1', accounts).accountId, 'one');
 assert.equal(statementAccountMatch('Transferência para 123456789', accounts).identified, false);
 assert.equal(statementAccountMatch('Conta: 01234567890', accounts).accountId, undefined);
 assert.equal(statementAccountMatch('Conta: 555555555', accounts).accountId, undefined);
 assert.equal(statementAccountMatch('Conta: 123456789\nConta: 555555555', accounts).accountId, undefined);
 assert.equal(statementAccountMatch('Conta: 123456789\nConta: 987654321', accounts).accountId, undefined);
 assert.equal(statementAccountMatch('Conta: 123456789', [...accounts, { id: 'duplicate', accountNumber: '123456789' }]).accountId, undefined);
});
test('optional Home banking references survive validated backups, while corrupt references are refused', () => {
 const data = emptyHome(); data.accounts[0].accountNumber = '123.456.789'; data.accounts[0].iban = 'AO06123456789012345678901';
 assert.equal(validateHomeData(JSON.parse(JSON.stringify(data))).accounts[0].accountNumber, '123.456.789');
 data.accounts[0].iban = '<invalid>';
 assert.throws(() => validateHomeData(data), /Identificador bancário/);
});
test('Portuguese monetary labels separate thousands in Kwanza and foreign currency', () => {
 assert.equal(formatForeignCurrency(3000, 'USD'), '3 000,00 USD');
 assert.match(formatKwanza(180097), /180 097,00/);
});
