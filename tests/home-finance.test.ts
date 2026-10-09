import {test} from 'node:test';
import assert from 'node:assert/strict';
import { addHomeEntry, emptyHome, balances, contributeHomeGoal, acquireHomeGoal, goalAcquired, reverseHomeEntry, validateHomeData, todayLocal, payHomeShopping } from '../src/utils/home';
import { BUSINESS_LEDGER_KEY, HOME_BRIDGE_JOURNAL, commitHomeBusinessTransfer, recoverHomeBusinessTransfer, assertBusinessTransfersCompatible } from '../src/utils/homeBusinessStorage';
import {HOME_STORAGE_KEY} from '../src/utils/home';
import {HomeData} from '../src/types/home';
import {BankMovement} from '../src/types/stock';

const setup=():HomeData=>({...emptyHome(),accounts:[{id:'wallet',name:'Carteira Kz',kind:'current',currency:'AOA',openingBalance:1000},{id:'dollar',name:'Carteira USD',kind:'current',currency:'USD',openingBalance:100},{id:'reserve',name:'Perfume',kind:'savings',currency:'AOA',openingBalance:0}],goals:[{id:'perfume',title:'Perfume',target:250,deadline:'2027-01-01',accountId:'reserve',fundingMode:'reserve',category:'Roupa'}]});
test('goals reserve once, acquire from the reserve and reverse the purchase without double-debit',()=>{
 let data=contributeHomeGoal(setup(),'perfume','wallet',250,todayLocal());
 assert.deepEqual(balances(data),{wallet:750,dollar:100,reserve:250});
 assert.equal(data.entries[0].type,'transfer');
 data=acquireHomeGoal(data,'perfume',todayLocal());
 assert.deepEqual(balances(data),{wallet:750,dollar:100,reserve:0});
 assert.equal(data.entries[0].type,'expense');assert.equal(data.entries[0].amount,250);
 assert.ok(goalAcquired(data,'perfume'));validateHomeData(data);
 assert.throws(()=>acquireHomeGoal(data,'perfume',todayLocal()),/já adquirida/);
 data=reverseHomeEntry(data,data.goals[0].acquisitionEntryId!,'Compra cancelada');
 assert.deepEqual(balances(data),{wallet:750,dollar:100,reserve:250});assert.equal(goalAcquired(data,'perfume'),false);validateHomeData(data);
});
test('planning contributions with the preference disabled do not fabricate or withdraw money',()=>{
 let data=setup();data.goals[0].fundingMode='plan';data.settings!.reserveGoals=false;
 assert.equal(validateHomeData(data).settings?.reserveGoals,false);
 data=contributeHomeGoal(data,'perfume','',250,todayLocal());
 assert.equal(data.entries.length,0);assert.equal(balances(data).wallet,1000);
 data=acquireHomeGoal(data,'perfume',todayLocal());
 assert.equal(data.entries.length,0);assert.ok(goalAcquired(data,'perfume'));validateHomeData(data);
});
test('USD and AOA are never implicitly exchanged, including bill and shopping payments',()=>{
 const data=setup();
 assert.throws(()=>contributeHomeGoal(data,'perfume','dollar',20,todayLocal()),/mesma moeda/);
 data.shopping=[{id:'item',name:'Livro USD',category:'Educação',currency:'USD',quantity:1,unitPrice:10,archived:false}];
 assert.throws(()=>payHomeShopping(data,'item','wallet',todayLocal()),/mesma moeda/);
 const next=payHomeShopping(data,'item','dollar',todayLocal());assert.equal(balances(next).dollar,90);assert.equal(balances(next).wallet,1000);
 data.bills=[{id:'bill',title:'Internet USD',currency:'USD',amount:10,category:'Internet',day:8,active:true}];
 assert.throws(()=>addHomeEntry(data,{type:'expense',title:'Internet',amount:10,date:todayLocal(),category:'Internet',accountId:'wallet',billId:'bill',billMonth:todayLocal().slice(0,7)}),/moeda/);
 data.budgets=[{id:'b1',category:'Internet',currency:'USD',month:'2026-10',limit:20},{id:'b2',category:'Internet',currency:'AOA',month:'2026-10',limit:20000}];validateHomeData(data);
});
class MemoryStorage implements Storage {
 map=new Map<string,string>();failOnce=false;
 get length(){return this.map.size;}clear(){this.map.clear();}key(i:number){return Array.from(this.map.keys())[i]??null;}getItem(key:string){return this.map.get(key)??null;}removeItem(key:string){this.map.delete(key);}setItem(key:string,value:string){if(this.failOnce&&key===HOME_STORAGE_KEY){this.failOnce=false;throw new Error('Quota exceeded');}this.map.set(key,String(value));}
}
const bridgeSetup=()=>{
 const storage=new MemoryStorage();const original=emptyHome();storage.setItem(HOME_STORAGE_KEY,JSON.stringify(original));storage.setItem(BUSINESS_LEDGER_KEY,'[]');
 const next=addHomeEntry(original,{type:'income',title:'Rendimento Business',category:'Rendimentos do Business',accountId:'home-wallet',amount:100,date:todayLocal(),businessMovementId:'business-out'});
 const movement:BankMovement={id:'business-out',bankId:'bank',type:'saida',amount:100,date:todayLocal()+'T12:00:00',reason:'Transferência Home',responsible:'Administrador',homeTransferId:next.entries[0].id,personalAccountId:'home-wallet',personalCurrency:'AOA'};
 return {storage,original,next,movement};
};
test('Business/Home transfer is durable and restores both originals on a failed second write',()=>{
 const {storage,original,next,movement}=bridgeSetup();storage.failOnce=true;
 assert.throws(()=>commitHomeBusinessTransfer(storage,JSON.stringify(original),'[]',next,[movement]),/dois saldos/);
 assert.equal(storage.getItem(HOME_STORAGE_KEY),JSON.stringify(original));assert.equal(storage.getItem(BUSINESS_LEDGER_KEY),'[]');assert.equal(storage.getItem(HOME_BRIDGE_JOURNAL),null);
 commitHomeBusinessTransfer(storage,JSON.stringify(original),'[]',next,[movement]);
 assert.equal(JSON.parse(storage.getItem(HOME_STORAGE_KEY)!).entries.length,1);assertBusinessTransfersCompatible(next,[movement]);
 assert.throws(()=>assertBusinessTransfersCompatible(original,[movement]),/cópia Home/);
 assert.throws(()=>reverseHomeEntry(next,next.entries[0].id,'Desfazer'),/Business\/Home/);
});
test('interrupted journals recover both sides and refuse to overwrite unrelated changes',()=>{
 const {storage,original,next,movement}=bridgeSetup();const beforeHome=JSON.stringify(original),afterHome=JSON.stringify(next),afterBusiness=JSON.stringify([movement]);
 const journal={version:1,phase:'prepared',beforeHome,beforeBusiness:'[]',afterHome,afterBusiness};
 storage.setItem(HOME_BRIDGE_JOURNAL,JSON.stringify(journal));storage.setItem(BUSINESS_LEDGER_KEY,afterBusiness);
 recoverHomeBusinessTransfer(storage);assert.equal(storage.getItem(HOME_STORAGE_KEY),beforeHome);assert.equal(storage.getItem(BUSINESS_LEDGER_KEY),'[]');
 storage.setItem(HOME_BRIDGE_JOURNAL,JSON.stringify({...journal,phase:'committed'}));recoverHomeBusinessTransfer(storage);assert.equal(storage.getItem(HOME_STORAGE_KEY),afterHome);assert.equal(storage.getItem(BUSINESS_LEDGER_KEY),afterBusiness);
 storage.setItem(HOME_BRIDGE_JOURNAL,JSON.stringify(journal));storage.setItem(BUSINESS_LEDGER_KEY,'[{"id":"external"}]');
 assert.throws(()=>recoverHomeBusinessTransfer(storage),/mudaram/);assert.equal(storage.getItem(BUSINESS_LEDGER_KEY),'[{"id":"external"}]');
});
