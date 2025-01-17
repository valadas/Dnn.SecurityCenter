import { Component, h, Prop, Host, Element, State } from "@stencil/core";
import { LocalizationClient, SecurityClient, LocalizationViewModel, SecurityBulletinsViewModel } from "../../services/services";
import state, { localizationState } from "../../store/state";
import alertError from "../../services/alert-error";
import dnnVersions from "../../data/dnn-versions";
import { Debounce } from "@dnncommunity/dnn-elements";

@Component({
  tag: 'dnn-security-center',
  styleUrl: 'dnn-security-center.scss',
  shadow: true
})
export class DnnSecurityCenter {
  private localizationClient: LocalizationClient;
  private securityClient: SecurityClient;
  private resx: LocalizationViewModel;
  
  constructor() {
    state.moduleId = this.moduleId;
    this.localizationClient = new LocalizationClient({ moduleId: this.moduleId });
    this.securityClient = new SecurityClient({ moduleId: this.moduleId });
  }
  
  @Element() el: HTMLDnnSecurityCenterElement;
  
  /** The Dnn module id, required in order to access web services. */
  @Prop() moduleId!: number;
  
  @State() selectValue: string = '090101';
  @State() securityBulletins: SecurityBulletinsViewModel;
  @State() expandedBulletinIndex: number;

  componentWillLoad() {
    return new Promise<void>((resolve, reject) => {
      this.localizationClient.getLocalization()
        .then(l => {
          localizationState.viewModel = l;
          this.resx = localizationState.viewModel;
          resolve();
        })
        .catch(reason => {
          alertError(reason);
          reject();
        });
    });
  }

  componentDidLoad() {
    this.getSecurityBulletins();
  }

  private getSecurityBulletins() {
    this.securityClient.getSecurityBulletins(this.selectValue).then(data => {
      this.securityBulletins = data;
    }).catch(reason => {
      alertError(reason);
    });
  }

  private handleSelect(event): void {
    this.selectValue = event.target.value;
    if (this.selectValue === 'All Versions') {
      window.location.reload();
      return;
    }
    this.getSecurityBulletins();
  }

  private decodeHtml(text: string): string {
    return text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace('”', '').replace('”', '');
  }

  @Debounce(200)
  private toggleCollapse(event: CustomEvent, index: number): void {
    const el = this.el.shadowRoot.querySelector(`#dnn-chevron-${index}`);
    requestAnimationFrame(() => {

      if (this.expandedBulletinIndex === index) {
        this.expandedBulletinIndex = undefined;
        el.removeAttribute('expanded');
      } else {
        if (event.detail) {
          this.expandedBulletinIndex = index;
        }
      }
    });
  }

  render() {
    return <Host>
      <div>
        <h1>{this.resx.uI.dnnSecurityCenter}</h1>
        <h3>
          {this.resx.uI.dnnPlatformVersion}: &nbsp;
          <select name="dnnVersions" onInput={e => this.handleSelect(e)}>
            {dnnVersions.map(version => 
              <option value={version.replace(/\./g, '')}>{version}</option>
            )}
          </select>
        </h3>
        {this.securityBulletins?.bulletins?.map((bulletin, index) => {
          return (
            <div class="bulletins">
              <div class="collapse-row">
                <div class="collapse-title">
                  <dnn-chevron id={'dnn-chevron-' + index} 
                    onChanged={e => {
                      this.toggleCollapse(e, index);
                    }}
                    expanded={this.expandedBulletinIndex === index}
                  ></dnn-chevron>
                  <h2 class="item-title">{bulletin.title}</h2>
                  <div class="item-published">Published: <strong>{bulletin.publicationDateUtc.toLocaleDateString()}</strong></div>
                </div>
              </div>
              <dnn-collapsible id="dnn-collapsible1" transition-duration="150" expanded={this.expandedBulletinIndex == index}>
                <div class="collapsible-slot-content item-description" innerHTML={this.decodeHtml(bulletin.description)}></div>
              </dnn-collapsible>
            </div>
          )
        })}
      </div>
    </Host>;
  }
}
