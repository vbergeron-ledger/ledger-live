import { PageHolder } from "tests/page/abstractClasses";
import { AccountPage } from "../page/account.page";
import { AccountsPage } from "../page/accounts.page";
import { PortfolioPage } from "../page/portfolio.page";
import { MarketPage } from "../page/market.page";
import { AddAccountModal } from "../page/modal/add.account.modal";
import { Layout } from "tests/component/layout.component";
import { Modal } from "../component/modal.component";
import { ReceiveModal } from "../page/modal/receive.modal";
import { SpeculosPage } from "tests/page/speculos.page";
import { SendModal } from "tests/page/modal/send.modal";
import { Drawer } from "tests/component/drawer.component";
import { SettingsPage } from "tests/page/settings.page";
import { LedgerSyncDrawer } from "./drawer/ledger.sync.drawer";
import { SwapPage } from "tests/page/swap.page";
import { SwapConfirmationDrawer } from "tests/page/drawer/swap.confirmation.drawer";
import { delegateModal } from "tests/page/modal/delegate.modal";
import { DelegateDrawer } from "./drawer/delegate.drawer";
import { SendDrawer } from "./drawer/send.drawer";
import { AssetDrawer } from "./drawer/asset.drawer";
import { PasswordlockModal } from "./modal/passwordlock.modal";
import { LockscreenPage } from "tests/page/lockscreen.page";
import { NFTDrawer } from "./drawer/nft.drawer";

export class Application extends PageHolder {
  public account = new AccountPage(this.page);
  public drawer = new Drawer(this.page);
  public accounts = new AccountsPage(this.page);
  public portfolio = new PortfolioPage(this.page);
  public market = new MarketPage(this.page);
  public addAccount = new AddAccountModal(this.page);
  public layout = new Layout(this.page);
  public modal = new Modal(this.page);
  public receive = new ReceiveModal(this.page);
  public speculos = new SpeculosPage(this.page);
  public send = new SendModal(this.page);
  public delegate = new delegateModal(this.page);
  public settings = new SettingsPage(this.page);
  public ledgerSync = new LedgerSyncDrawer(this.page);
  public swap = new SwapPage(this.page);
  public swapDrawer = new SwapConfirmationDrawer(this.page);
  public delegateDrawer = new DelegateDrawer(this.page);
  public sendDrawer = new SendDrawer(this.page);
  public assetDrawer = new AssetDrawer(this.page);
  public password = new PasswordlockModal(this.page);
  public LockscreenPage = new LockscreenPage(this.page);
  public nftDrawer = new NFTDrawer(this.page);
}
