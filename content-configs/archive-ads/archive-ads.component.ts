import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, UntypedFormBuilder } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { GlobalService } from 'src/app/shared/services/global.service';
import { JarrahanProccessService } from 'src/app/shared/services/jarrahan-proccess.service';
import { PublicService } from 'src/app/shared/services/public.service';
import { SharedPipesModule } from "../../../../../shared/pipes/shared-pipes.module";
import { DirectiveModule } from 'src/app/shared/directive/directive.module';
import { SharedModule } from 'src/app/shared/modules/shared.module';
import { MaterialModule } from 'src/app/shared/modules/material/material.module';
import * as moment from 'jalali-moment';
import moment2 from 'jalali-moment';
import { LoadingService } from 'src/app/shared/services/loading.service';
import { ContentService } from '../../../services/content.service';
import { JarrahanOrderService } from 'src/app/layout/jarrahan/jarrahan-order/services/jarrahan-order.service';
import { JarrahanGlobalService } from 'src/app/layout/jarrahan/services/jarrahan.global.service';
@Component({
  selector: 'app-archive-ads',
  standalone: true,
  imports: [CommonModule, SharedPipesModule, FormsModule, DirectiveModule, SharedModule, MaterialModule, ReactiveFormsModule],
  templateUrl: './archive-ads.component.html',
  styleUrl: './archive-ads.component.scss'
})
export class ArchiveAdsComponent {
  @Input() index: any;
  selected_content: any;
  ramaindate = new FormControl(null);
  remaindate: any = null;
  isActive: boolean = false;
  submited: boolean = false;
  today: Date;
  todayshow: any;
  ads: any[] = [];
  contentList: any[] = [];
  showmodal: boolean = false;
  showmodal2: boolean = false;
  step: number = 1;
  isdiscount: boolean = false;
  discountapply: boolean;
  discount_percent: number = 0;
  discountAll: boolean;
  selected_ads: any;
  selected_month: any;
  ownerID: string = '';
  showconfirm_alert: boolean = false;
  position2: any;
  showconfirm_alert2: boolean = false;
  position3: any;
  selected_month_number: number;
  finalPrice: number = 0;
  selected_title: string = '';
  constructor(public _GlobalService: GlobalService,
    public _JarrahanGlobalService: JarrahanGlobalService,
    public _JarrahanOrderService: JarrahanOrderService,
    public _ContentService: ContentService,
    public _PublicService: PublicService,
    public _LoadingService: LoadingService,
    private router: Router,
    private formBuilder: UntypedFormBuilder,
    public _JarrahanProccessService: JarrahanProccessService,
    private activatedRoute: ActivatedRoute) {

  }

  nDateChange(event: any) {
    var date = moment2(new Date(event.value).toISOString()).locale('fa').format('YYYY/MM/DD')
    this.remaindate = moment.from(date, 'fa', 'YYYY/MM/DD').locale('en').format('YYYY-MM-DD');
  }

  close() {
    this.showmodal = false;
    this.showmodal2 = false;
  }

  nextStep() {
    if (this.step === 1) {
      this._JarrahanOrderService.adList = [];
      this.newads();
    }
    this.step += 1;
  }

  previusStep() {
    this.step -= 1;
  }

  ngAfterViewInit() {
    this.taxEnabled();
    this.getinvoice_number();

    this.today = new Date();
    var date = moment2(new Date().toISOString()).locale('fa').format('YYYY/MM/DD')
    this.todayshow = moment.from(date, 'fa', 'YYYY/MM/DD').locale('en').format('YYYY-MM-DD');

    this._PublicService.getAll('/jarahan/ads/archives?page=' + this._ContentService.articleModel._id + '&type=inContent' + '&position=' + this._JarrahanGlobalService.selected_position)
      .subscribe(
        (res: any) => {
          this.contentList = res.data.list;
          this.getads();
        },
        err => {
          this._GlobalService.parseError(err)
        }
      )
  }

  editcontent(index: number) {
    this._ContentService.archive_contents = this.contentList[index].contents;
    this._JarrahanGlobalService.show_archive_content = true;
    this._JarrahanGlobalService.archive_id = this.contentList[index]._id;
    this._JarrahanGlobalService.ads_tab = 4;
  }

  getads() {
    var paramObj = "pageType=" + this._ContentService.jarrahan_type + "&page=" + this._ContentService.articleModel._id
      + "&ownerType=surgeon" + "&type=" + 'inContent';
    this._PublicService.get_all('/jarahan/ads?', paramObj)
      .subscribe((res: any) => {
        this.ads = res.data.ads;
        if (this.ads.length > 0) {
          this.isActive = true;
          this.ads.forEach(element => {
            if (element.availableMonth) {
              element.newavailableMonth = [];
              for (let i = 0; i < element.availableMonth.length; i++) {
                var model = {
                  selected: false,
                  value: element.availableMonth[i],
                  title: ''
                }

                if (element.availableMonth[i] === 'm1')
                  model.title = '1 ماه'
                if (element.availableMonth[i] === 'm3')
                  model.title = '3 ماه'
                if (element.availableMonth[i] === 'm6')
                  model.title = '6 ماه'
                if (element.availableMonth[i] === 'y1')
                  model.title = '1 سال'

                element.newavailableMonth.push(model);
              }
            }
          });

        }

        else
          this.isActive = false;

      },
        (err: any) => {
        }
      );
  }


  select_position(item: any, item1: any) {
    this.selected_ads = item1;
    item1.newavailableMonth.forEach((element: { selected: boolean; }) => {
      element.selected = false;
    });
    item.selected = true;
    this.selected_title = item.title;
    if (item.value === 'm1')
      this.selected_month_number = 1
    if (item.value === 'm3')
      this.selected_month_number = 3
    if (item.value === 'm6')
      this.selected_month_number = 6
    if (item.value === 'y1')
      this.selected_month_number = 12

    this.selected_month = item.value;

    var price = 0;
    item1.newprice = 0;
    price = this.selected_month_number * item1.price;
    item1.newprice = price;
    this.finalPrice = price;
  }

  selectads() {

  }

  getDaysSince(dateString: string): number {
    const inputDate = new Date(dateString);
    const currentDate = new Date();

    // اختلاف زمان بر حسب میلی‌ثانیه
    const timeDifference = currentDate.getTime() - inputDate.getTime();

    // تبدیل اختلاف به روز
    const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

    return daysDifference;
  }

  confirm2(e: MouseEvent) {
    if (this._JarrahanOrderService.adList.length === 0)
      return;
    this.showconfirm_alert2 = !this.showconfirm_alert2;
    this.position3 = {
      x: e.clientX - 100,
      y: e.clientY
    };
  }


  confirm(e: MouseEvent) {
    let all = this._JarrahanOrderService.adList?.every((item: any) => (item.havediscount === undefined || item.havediscount === false));
    if (all) {
      this.submit_confirm(1);
    }

    else {
      if (this._JarrahanOrderService.adList.length === 0)
        return;
      this.showconfirm_alert = !this.showconfirm_alert;
      this.position2 = {
        x: e.clientX - 100,
        y: e.clientY
      };
    }

  }

  submit_confirm(e: any) {
    if (e === 1) {
      this._JarrahanOrderService.discountapply = false;
      if (this._JarrahanOrderService.discount_percent !== null)
        this._JarrahanOrderService.discountapply = true;
      this._JarrahanOrderService.discount_toAll();
      this.showconfirm_alert = false;
      this.discountAll = true;
      return;
    }
    else if (e === 2) {
      this.submit_discount();
      this.showconfirm_alert = false;
    }

    else {
      this.showconfirm_alert = false;
    }
  }

  submit_discount() {
    this._JarrahanOrderService.discountapply = false;
    if (this._JarrahanOrderService.discount_percent !== null)
      this._JarrahanOrderService.discountapply = true;

    this._JarrahanOrderService.set_general_discount();
  }

  submit_confirm2(e: any) {
    if (e === 1) {
      this.discountAll = false;
      this._JarrahanOrderService.discountapply = false;
      this._JarrahanOrderService.discount_percent = 0;
      // this._JarrahanOrderService.set_general_discount();
      this._JarrahanOrderService.removeAll();


      this.showconfirm_alert2 = false;
    }

    else {
      this.showconfirm_alert2 = false;
    }

  }

  newads() {
    var model = {
      ad_type: 'inContent',
      content_type: this._ContentService.jarrahan_type,
      content: this._ContentService.articleModel,
      ads: this.selected_ads,
      month: this.selected_month,
    }
    this._JarrahanOrderService.adList.push(model);
    // console.log(this._JarrahanOrderService.adList);

    this._JarrahanOrderService.allprice_change();
    this._JarrahanOrderService.set_general_discount();
    this._JarrahanOrderService.adList.forEach(element => {
      element.percent = 0;
      element.havediscount = false;
      element.firstpercent = 0;
    });
    var finded;
    for (let i = 0; i < this._JarrahanOrderService.adList.length; i++) {

      const discount = this._JarrahanOrderService.adList[i].ads.discounts.find(
        (x: any) => x.month === this._JarrahanOrderService.adList[i].month
      );

      if (discount) {
        const finded = discount.value;
        this._JarrahanOrderService.adList[i].percent = finded;
        this._JarrahanOrderService.adList[i].havediscount = true;
        this._JarrahanOrderService.adList[i].firstpercent = finded;
        this.change_item_discount(this._JarrahanOrderService.adList[i], i, finded);
      }

    }
  }

  change_item_discount(item: any, index: number, e: any) {
    var discount_percent = Number(e);
    if (discount_percent > 0) {
      this._JarrahanOrderService.adList[index].havediscount = true;
      this._JarrahanOrderService.adList[index].ads.newprice = 0;
      this._JarrahanOrderService.adList[index].ads.newprice = Math.round(this._JarrahanOrderService.adList[index].ads.price - ((discount_percent * 0.01) * this._JarrahanOrderService.adList[index].ads.price));
    }

    else {
      this._JarrahanOrderService.adList[index].havediscount = false;
      this._JarrahanOrderService.adList[index].ads.newprice = this._JarrahanOrderService.adList[index].ads.price;
    }
    item.show_discount = false;
    this._JarrahanOrderService.allprice_change();
    this._JarrahanOrderService.allprice_changemain();
    this._JarrahanOrderService.set_discount_price();
    this._JarrahanOrderService.set_tax();
    this._JarrahanOrderService.factordiscount();
    this._JarrahanOrderService.discount_toAll();
  }

  change_tax(e: any) {
    if (e.target.value === '1') {
      this._JarrahanOrderService.istax = true;
      this._JarrahanOrderService.set_tax();
    }

    else {
      this._JarrahanOrderService.istax = false;
      this._JarrahanOrderService.remove_tax();
    }
  }

  taxEnabled() {
    var param = 'key=tax-enabled';
    this._PublicService.getAll('/systemConfig/config-value?' + param)
      .subscribe(
        (res: any) => {
          this._JarrahanOrderService.istax = res.data;
          this.taxAmount();

        },
        err => {
          // this._GlobalService.parseError(err)
        }
      )
  }

  taxAmount() {
    var param = 'key=tax-amount';
    this._PublicService.getAll('/systemConfig/config-value?' + param)
      .subscribe(
        (res: any) => {
          this._JarrahanOrderService.tax_amount = res.data;
          if (this._JarrahanOrderService.istax)
            this._JarrahanOrderService.set_tax();
        },
        err => {
          // this._GlobalService.parseError(err)
        }
      )
  }

  getinvoice_number() {
    this._PublicService.getAll('/jarahan/ads/invoice-number')
      .subscribe(
        (res: any) => {
          this._JarrahanOrderService.invoice_number = res.data;
        },
        err => {
          // this._GlobalService.parseError(err)
        }
      )
  }

  ads_submit() {
    this.submited = true;
    if (this.remaindate === null)
      return
    var ads: any[] = [];

    if (this._JarrahanOrderService.adList.length === 0) {
      this._GlobalService.showError('تبلیغی انتخاب نشده است!')
      return;
    }
    this._JarrahanOrderService.adList.forEach(element => {
      ads.push(
        {
          "id": element.ads._id,
          "month": element.month,
          "discount": element.percent
        }
      )
    });
    this._LoadingService.show();
    var model: any = {
      "ads": ads,
      "discount": this._JarrahanOrderService.discount_percent,
      "discountType": this.discountAll ? 'toAll' : 'toRemainder',
      "ownerType": "surgeon",
      "owner": this.ownerID,
      "taxEnabled": this._JarrahanOrderService.istax,
      "taxAmount": this._JarrahanOrderService.istax ? this._JarrahanOrderService.tax_amount : '',
      "payDeadline": this.remaindate.split("T")[0] + 'T' + '23:59:59'
    }

    if (!this._JarrahanOrderService.istax)
      delete model.taxAmount;

    this._PublicService.post('/jarahan/ads/form', model)
      .subscribe(
        (res: any) => {
          this.step = 3;
          this._LoadingService.hide();
          this._GlobalService.showSuccess('با موفقیت ثبت شد!');
        },
        err => {
          this._LoadingService.hide();
          // this._GlobalService.parseError(err)
        }
      )
  }

}
