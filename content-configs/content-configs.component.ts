import { Component, ElementRef, HostListener, QueryList, Renderer2, TemplateRef, ViewChild, ViewChildren, ViewContainerRef } from '@angular/core';
import { GlobalService } from 'src/app/shared/services/global.service';
import { JarrahanProccessService } from 'src/app/shared/services/jarrahan-proccess.service';
import { PublicService } from 'src/app/shared/services/public.service';
// @ts-ignore
import * as CKEDITOR from '../../../../../assets/ckeditor-build/build/ckeditor';
import { environment } from 'src/environments/environment';
import { debounceTime, Subject, Subscription } from 'rxjs';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import * as moment from 'jalali-moment';
import { LoadingService } from 'src/app/shared/services/loading.service';
import { JarrahanGlobalService } from 'src/app/layout/jarrahan/services/jarrahan.global.service';
import { ContentService } from '../../services/content.service';
import { ArticleProccessService } from 'src/app/shared/services/article-proccess.service';
import { ContetntService } from 'src/app/shared/services/contents.service';
import * as L from 'leaflet';
import { DomSanitizer } from '@angular/platform-browser';
import { EditorService } from 'src/app/shared/services/editor.service';
import { ContentGlobalService } from '../../services/content-global.service';
import {
  trigger, transition, style, animate
} from '@angular/animations';
const staticContents = [
  { type: "CFS", title: "لیست کلینیک ها" },
  { type: "CFS", title: "بخش های بستری" },
  { type: "CFS", title: "اتاق های عمل" },
  { type: "CFS", title: "خدمات تخصصی" },
  { type: "CFS", title: "لیست پاراکلینیک ها" },
  { type: "CFS", title: "امکانات رفاهی" },
  { type: "CFS", title: "لیست بیمه ها" },
  { type: "CFS", title: "آرشیو عکس ها" },
  { type: "CFS", title: "آرشیو ویدیوها" },
];
type EditorObj = {
  instance: any;
  isOpen: boolean;
};
@Component({
  selector: 'app-content-configs',
  templateUrl: './content-configs.component.html',
  styleUrl: './content-configs.component.scss',
  animations: [
    trigger('fadeInOut', [
      // برای ورود
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.97)' }),
        animate('180ms 100ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
        // 100ms delay اضافه شد فقط برای ورود
      ]),
      // برای خروج
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.97)' }))
      ])
    ])
  ]
})

export class ContentConfigsComponent {
  selected_ads_index: any;
  @ViewChildren('mapRef') mapRefs!: any;
  selected_all: boolean = false;
  cycleList: any[] = [];
  showcommentSett: boolean = false;
  userInfo: any;
  comment = {
    text: '',
    date: '',
    reply: '',
    admin: {
      profile: '',
      familyName: '',
      name: '',
    }
  }
  today: Date;
  date = new FormControl(new Date());
  showplus: boolean = false;
  public ClassicEditor = CKEDITOR.ClassicEditor;
  public InlineEditor = CKEDITOR.InlineEditor;
  public config: any;
  content2: string = '';
  selectedType: any;
  // ViewChild to reference the delete box element
  @ViewChild('del', { read: ElementRef, static: false }) delete_box: ElementRef | undefined;
  @ViewChild('lockbox', { read: ElementRef, static: false }) lockbox: ElementRef | undefined;
  // Flags to manage editing states and modal display
  edited: boolean = false;
  show_modal: boolean = false;
  isstatic: boolean = false;
  submited: boolean | undefined = false;
  // Title and content properties for forms
  title: string = '';
  showcontent: string = '';
  content: string = '';
  showeditor: boolean = false;
  publishDate: string;
  current_index: any;
  currentData: any;
  dragging: boolean = false;
  draggingindex: any;
  position = { x: 0, y: 0 };
  box1position = { x: 0, y: 0 };
  box2position = { x: 0, y: 0 };
  positionall = { x: 0, y: 0 };
  showconfigs: boolean = false;
  showconfigBox: boolean = false;
  showcomm_editor: boolean = false;
  selected_content: any;
  selected_index: any;
  selected_showindex: any;
  ads_selected_index: any;
  adsshowcomm_editor: boolean = false;
  currentAdsList: any[] = [];
  showAds: boolean = true; // برای کنترل نمایش بدون حذف شدن
  ads_configs: any;
  show_middle: boolean = false;
  opendel_box: boolean = false;
  showTiming: boolean = false;
  menuOpen = false;
  adsshowconfigs: boolean = false;
  ads_selectedindex: any;
  editorInstance: any;
  isEditorDisabled = false;
  overtoolbar: boolean = false;
  blocktitle: string = ''
  middletitle: string = ''
  editorInstances: { [key: number]: any } = {};
  openlock_box: boolean = false;
  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private sanitizer: DomSanitizer,
    public _JarrahanGlobalService: JarrahanGlobalService,
    public _ContentGlobalService: ContentGlobalService,
    public _LoadingService: LoadingService,
    public _GlobalService: GlobalService, // Service for global functionalities
    public _PublicService: PublicService, // Service for public-related functionalities
    public _ContentService: ContentService, // Custom service for handling Jarrahan-specific data
    public _ArticleProccessService: ArticleProccessService,
    public _ContetntService: ContetntService,
    public _EditorService: EditorService
  ) {
    this.today = new Date();
    this.publishDate = new Date().toISOString().split("T")[0];
  }

  get currentLock() {
    return this._ContentService.articleModel.contents[this.selected_index]?.lock;
  }

  get currentLock2() {
    return this._ContentService.articleModel.contents[this.ads_selected_index]?.lock;
  }



  resetMapState() {
    this._JarrahanGlobalService.initializedMaps.clear();
    this._JarrahanGlobalService.maps = {};
    this._JarrahanGlobalService.markers = {};
  }



  private mapInitialized = false;
  ngDoCheck(): void {
    // فقط یک بار نقشه را مقداردهی کن
    if (this._ContentGlobalService.active_tab === 8 && !this.mapInitialized) {
      this.mapInitialized = true;
      setTimeout(() => this.tryInitializeMaps(), 500);
    }
  }


  @ViewChildren('ckeditor') ckEditors: QueryList<any>;
  ngAfterViewInit() {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/marker-icon-2x.png',
      iconUrl: 'assets/marker-icon.png',
      shadowUrl: 'assets/marker-shadow.png',
    });
    this.get_ads_setting();
    setTimeout(() => {
      this._ContentService.articleModel.contents.forEach(element => {
        if (element.cycle !== undefined) {
          element.iscycle = true;
          element.cycleTitle = element.cycle.name;
        }


        // init ads in edit form
        if (element.type === 'ads') {
          element.backups = element.backups ? element.backups : [];
          element.contents = element.contents ? element.contents : [];
          element.ad_index = element.setting.index;
        }
      });

      this._ContentService.articleModel.contents.forEach(element => {
        element.selected = false;
        element.cycleTitle = '';
        element.lock = false;
        element.opencycle = false;
        element.iscycle = false;
        this._ContentService.contents.push(element)
        if (element.cycle)
          element.cycle = element.cycle._id;
      });


      this.mixContent(true);

    }, 3000);
    this.userInfo = JSON.parse(localStorage.getItem('data')!).data;
    // this.comment.admin = this.userInfo;
    // setTimeout(() => {
    //   this.tryInitializeMaps();
    // }, 10000);
  }

  // Method to initiate a new content form
  new_content(index?: any) {
    // console.log(index);
    if (index === 'last')
      this._ContentService.selectedindex = this._ContentService.contents.length + 1;

    if (index !== undefined)
      this._ContentService.selectedindex = index;
    this.isstatic = false;
    this.edited = false;
    this.submited = false;
    this.show_middle = true;
    this.showplus = true;
    this.title = '';
    this.content = '';
    this.hide_all()
    this.menuOpen = false;
  }

  newAds(type: string = '') {

  }

  proccess() {
    // console.log('proccess');

    if (this._ContentService.mixedContent) {
      this._ArticleProccessService.proccess_H_Tags(this._ContentService.mixedContent!);
      this._ArticleProccessService.proccess_A_Tags(this._ContentService.mixedContent!);
      this._ArticleProccessService.proccessImage_Video(this._ContentService.mixedContent!);
      this._ArticleProccessService.proccessVideo(this._ContentService.mixedContent!);
      this._ArticleProccessService.proccessContent(this._ContentService.mixedContent!);
      // this._JarrahanProccessService.proccess_sentence(this._ContentService.mixedContent!);
      this._ArticleProccessService.proccessContentLength(this._ContentService.mixedContent!);
      // this._JarrahanProccessService.proccess_sentence(this._ContentService.mixedContent!);
      this._ArticleProccessService.check_keyWords();
      this._ArticleProccessService.check_mainKeyWord();
      this._ArticleProccessService.check_images_same_alt();
      this._ArticleProccessService.check_links_title_duplicate();
      this._ArticleProccessService.check_links_href_duplicate();
      this._ContentService.related_KeyWord_count();
    }
  }

  private debounce(func: Function, wait: number) {
    let timeout: any;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        func.apply(this, args);
      }, wait);
    };
  }

  private debounceProccess = this.debounce(() => {
    this.proccess();
  }, 500);

  private debounceProccessSentence = this.debounce((content: string) => {
    this._ArticleProccessService.proccess_sentence(content);
  }, 500);


  change_adsContent() {
    let timeout: any;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      this.mixContent();
      // this.addOriginalToImages();
    }, 500);
  }

  // mixedContent: string = '';
  mixContent(first: boolean = false): void {
    for (let i = 0; i < this._ContentService.articleModel.contents.length; i++) {
      const item = this._ContentService.articleModel.contents[i];


      if (item.type === 'ads') {
        const innerLists = [...(item.backups || []), ...(item.contents || [])];
        for (const subItem of innerLists) {
          // console.log(subItem);

          if (subItem.type === 'template' && subItem.temid) {
            const container = document.getElementById(subItem.temid);
            if (!container) continue;

            const tempDiv = document.createElement('div');
            Array.from(container.childNodes).forEach(node =>
              tempDiv.appendChild(node.cloneNode(true))
            );

            // --- حذف کامنت‌ها ---
            const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_COMMENT, null);
            let currentNode: Node | null = walker.nextNode();
            const commentsToRemove: Comment[] = [];
            while (currentNode) {
              commentsToRemove.push(currentNode as Comment);
              currentNode = walker.nextNode();
            }
            commentsToRemove.forEach(c => c.parentNode?.removeChild(c));

            // --- پاکسازی نودها ---
            const cleanNode = (el: HTMLElement) => {
              Array.from(el.attributes).forEach(attr => {
                if (attr.name.startsWith('_ng') || attr.name.startsWith('ng-reflect') || attr.name.startsWith('cdk')) {
                  el.removeAttribute(attr.name);
                }
              });
              const children = Array.from(el.children) as HTMLElement[];
              children.forEach(child => {
                const classNames = child.classList?.value || '';
                if (subItem.template_type === 'doctor-map' && classNames.includes('tem-map-container')) {
                  child.remove();
                } else if (child.tagName.startsWith('APP-') || classNames.includes('menu-container')) {
                  child.remove();
                } else {
                  cleanNode(child);
                }
              });
            };

            Array.from(tempDiv.children).forEach(child => cleanNode(child as HTMLElement));
            // ✅ در نهایت ست کردن HTML تمیز داخل content خودش
            subItem.content = tempDiv.innerHTML;
          }

        }
      }

      if (item.type !== 'template') continue;

      // DOM اصلی سکشن را پیدا کن
      const container = document.getElementById(item.temid);
      if (!container) continue;

      // کپی محتوا
      const tempDiv = document.createElement('div');
      Array.from(container.childNodes).forEach(node => tempDiv.appendChild(node.cloneNode(true)));

      // حذف کامنت‌ها
      const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_COMMENT, null);
      let currentNode: Node | null = walker.nextNode();
      const commentsToRemove: Comment[] = [];
      while (currentNode) {
        commentsToRemove.push(currentNode as Comment);
        currentNode = walker.nextNode();
      }
      commentsToRemove.forEach(c => c.parentNode?.removeChild(c));

      // تابع بازگشتی برای تمیز کردن attributes و حذف تگ‌های Angular
      const cleanNode = (el: HTMLElement) => {
        Array.from(el.attributes).forEach(attr => {
          if (
            attr.name.startsWith('_ng') ||
            attr.name.startsWith('ng-reflect') ||
            attr.name.startsWith('cdk')
          ) {
            el.removeAttribute(attr.name);
          }
        });

        const children = Array.from(el.children) as HTMLElement[];
        children.forEach(child => {
          const classNames = child.classList?.value || '';
          if (child.tagName.startsWith('APP-') || classNames.includes('menu-container')) {
            child.remove();
          } else {
            cleanNode(child);
          }
        });
      };

      Array.from(tempDiv.children).forEach(child => cleanNode(child as HTMLElement));

      item.content = tempDiv.innerHTML;
    }

    const array: any[] = [];

    // پیمایش محتوای اصلی
    this._ContentService.articleModel.contents.forEach(item => {
      // ✅ حالت معمولی
      if (item.type === 'content') {
        array.push({
          status: true,
          content: item.content
        });
      }

      // ✅ حالت template (مثل مثالی که دادی)
      else if (item.type === 'template') {
        array.push({
          status: true,
          content: item.content
        });
      }

      // ✅ حالت خاص adsType = "list"
      else if (item.adsType === 'list' && Array.isArray(item.backups)) {
        item.backups.forEach((subItem: any) => {
          // هر subItem ممکنه خودش هم content داشته باشه
          if (subItem.content) {
            array.push({
              status: true,
              content: subItem.content
            });
          }

          // اگه داخل subItem خودش contents داشته باشه (احتمال تو در تو)
          if (Array.isArray(subItem.backups)) {
            subItem.contents.forEach((deepItem: any) => {
              if (deepItem.content) {
                array.push({
                  status: true,
                  content: deepItem.content
                });
              }
            });
          }
        });
      }

      else if (item.adsType === 'list' && Array.isArray(item.contents)) {
        item.backups.forEach((subItem: any) => {
          // هر subItem ممکنه خودش هم content داشته باشه
          if (subItem.content) {
            array.push({
              status: true,
              content: subItem.content
            });
          }

          // اگه داخل subItem خودش contents داشته باشه (احتمال تو در تو)
          if (Array.isArray(subItem.contents)) {
            subItem.contents.forEach((deepItem: any) => {
              if (deepItem.content) {
                array.push({
                  status: true,
                  content: deepItem.content
                });
              }
            });
          }
        });
      }

    });

    // اگر first تنظیم شده باشه
    if (first) {
      this._ContentService.articleModel.contents.forEach(element => {
        if ((element.backups?.length || 0) > 0 || (element.contents?.length || 0) > 0) {
          // element.show_content = true;
        }
      });
    }

    // ✅ ترکیب تمام محتواها در mixedContent
    this._ContentService.mixedContent = array
      .filter(item => item.status)
      .map(item => item.content)
      .join('');

    // ✅ ارسال هر content به پردازش جمله
    array.forEach(element => {
      this.debounceProccessSentence(element.content);
    });

    // ✅ اجرای debounce کلی
    this.debounceProccess();

    setTimeout(() => {
      this.addOriginalToImages();
    }, 500);

  }


  addOriginalToImages(): void {
    const contents = this._ContentService.articleModel.contents;
    if (!Array.isArray(contents)) return;

    const processContent = (contentItem: any) => {
      // اگر محتوای متنی شامل img باشد
      if (typeof contentItem.content === 'string' && contentItem.content.includes('<img')) {
        // از regex استفاده می‌کنیم تا به‌صورت مستقیم در رشته تغییر بدیم
        contentItem.content = contentItem.content.replace(
          /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi,
          (match: string, before: any, src: any, after: any) => {
            // اگر قبلاً original وجود نداشته باشد اضافه می‌کنیم
            if (!/original=/.test(match)) {
              return `<img${before}src="${src}" original="${src}"${after}>`;
            }
            return match;
          }
        );
      }

      // بررسی تو در توها
      if (Array.isArray(contentItem.backups)) {
        contentItem.backups.forEach(processContent);
      }
      if (Array.isArray(contentItem.contents)) {
        contentItem.contents.forEach(processContent);
      }
    };

    contents.forEach(processContent);

    console.log('✅ تصاویر با original اضافه شدند', this._ContentService.articleModel.contents);
  }



  // Handle drag-and-drop reordering of items
  drop(event: CdkDragDrop<any[]>) {
    const generateId = () => Date.now() + Math.floor(Math.random() * 1000);

    if (this._JarrahanGlobalService.currentDragIndex !== null) {
      const originalTemplate = this._JarrahanGlobalService.templates[this._JarrahanGlobalService.currentDragIndex];
      const item = structuredClone(originalTemplate);
      if (item.type === 'template')
        item.temid = 'template-' + generateId();

      if (item.template_type === 'button') {
        const generateId = () => Date.now() + Math.floor(Math.random() * 1000);
        item.tem_items = [
          { type: '', text: '021359874562', class: 'n', id: generateId(), active: false },
          { type: '', text: ' ثبت درخواست مشاوره', class: 'b', id: generateId(), active: false }
        ];
      }

      else if (item.template_type === 'doctor-header') {
        const generateId = () => Date.now() + Math.floor(Math.random() * 1000);
        item.tem_items = [
          { svg: this.sanitizer.bypassSecurityTrustHtml(this._JarrahanGlobalService.svgList[0].svg), text: 'اینستاگرام', class: 'social', id: generateId(), active: false, link: '' },
          { svg: this.sanitizer.bypassSecurityTrustHtml(this._JarrahanGlobalService.svgList[1].svg), text: 'تلگرام', class: 'social', id: generateId(), active: false, link: '' },
          { svg: this.sanitizer.bypassSecurityTrustHtml(this._JarrahanGlobalService.svgList[2].svg), text: 'واتساپ', class: 'social', id: generateId(), active: false, link: '' },
          { svg: this.sanitizer.bypassSecurityTrustHtml(this._JarrahanGlobalService.svgList[3].svg), text: 'توییتر', class: 'social', id: generateId(), active: false, link: '' }
        ];

      }


      else if (item.template_type === 'doctor-contact') {
        const generateId = () => Date.now() + Math.floor(Math.random() * 1000);
        item.tem_items = [
          { svg: this.sanitizer.bypassSecurityTrustHtml(this._JarrahanGlobalService.contact_svgList[0].svg), text: this._JarrahanGlobalService.contact_svgList[0].title, value: '021-87654321', id: generateId(), active: false },
          { svg: this.sanitizer.bypassSecurityTrustHtml(this._JarrahanGlobalService.contact_svgList[1].svg), text: this._JarrahanGlobalService.contact_svgList[1].title, value: '021-87654321', id: generateId(), active: false },
          { svg: this.sanitizer.bypassSecurityTrustHtml(this._JarrahanGlobalService.contact_svgList[2].svg), text: this._JarrahanGlobalService.contact_svgList[2].title, value: '09123456789', id: generateId(), active: false },
          { svg: this.sanitizer.bypassSecurityTrustHtml(this._JarrahanGlobalService.contact_svgList[3].svg), text: this._JarrahanGlobalService.contact_svgList[3].title, value: 'doctor@example.com', id: generateId(), active: false }
        ];

      }


      else if (item.template_type === 'doctor-portfolio') {
        const generateId = () => Date.now() + Math.floor(Math.random() * 1000);
        item.tem_items = [
          { img: 'https://www.drhosseinnejad.com/wp-content/uploads/sen-amal-bini.jpeg', imgalt: '', title: 'جراحی زیبایی بینی', description: 'نمونه جراحی زیبایی بینی با تکنیک پیشرفته', id: generateId(), active: false },
          { img: 'https://www.drhosseinnejad.com/wp-content/uploads/ax-bini.jpg', imgalt: '', title: 'جراحی فرم دهی بینی', description: 'اصلاح فرم بینی با حفظ تناسب چهره', id: generateId(), active: false },
          { img: 'https://www.drhosseinnejad.com/wp-content/uploads/amal-bini-1.jpg', imgalt: '', title: 'رینوپلاستی', description: 'جراحی زیبایی و عملکردی بینی', id: generateId(), active: false },
        ];
      }

      else if (item.template_type === 'doctor-comments') {
        const generateId = () => Date.now() + Math.floor(Math.random() * 1000);
        item.tem_items = [
          { img: '', title: 'مریم احمدی', description: 'نمونه جراحی زیبایی بینی با تکنیک پیشرفته', date: '۳ ماه پیش', id: generateId(), active: false, tags: ['درمان موفق', 'برخورد عالی'], rate: 5 },
          { img: '', title: 'رضا کریمی', description: 'نمونه جراحی زیبایی بینی با تکنیک پیشرفته', date: '۳ ماه پیش', id: generateId(), active: false, tags: ['درمان موفق', 'برخورد عالی'], rate: 5 },
        ];
      }


      else if (item.template_type === 'doctor-map') {
        this.lansmap_click_hint = false;
        setTimeout(() => {
          this.initMap(event.currentIndex);
        }, 10);
      }

      this._ContentService.articleModel.contents.splice(event.currentIndex, 0, item);

      this._JarrahanGlobalService.currentDragIndex = null;

      if (item.template_type === 'doctor-comments') {
        const wrappers = document.querySelectorAll<HTMLElement>('.reviews-wrapper');

        wrappers.forEach(wrapper => {
          wrapper.addEventListener(
            'wheel',
            function (event) {
              if (event.deltaY !== 0) {
                event.preventDefault();
                wrapper.scrollLeft += event.deltaY;
              }
            },
            { passive: false }
          );
        });


      }
    }
    else {
      var type: string = '';
      const previousIndex = event.previousIndex;
      const currentIndex = event.currentIndex;

      const previousItem = this._ContentService.articleModel.contents[previousIndex];
      const currentItem = this._ContentService.articleModel.contents[currentIndex];

      var index = 0;
      for (let i = 0; i < this._ContentService.articleModel.contents.length; i++) {
        if ((this._ContentService.articleModel.contents[i].adsType === 'list' || this._ContentService.articleModel.contents[i].adsType === 'video') &&
          this._ContentService.articleModel.contents[i].ad_index === previousItem.ad_index)
          index = i;
      }

      if (
        ((previousItem.adsType === 'list' && currentItem.adsType === 'list') || (previousItem.adsType === 'video' && currentItem.adsType === 'video')) &&
        (previousItem.ad_index < currentItem.ad_index || previousItem.ad_index > currentItem.ad_index)
      ) {
        this._GlobalService.showError('تبلیغ نمی‌تواند به جایگاه غیر مجاز منتقل شود.', 'خطای ترتیب تبلیغات');
        this.dragging = false;
        return;
      }

      else if (index > currentIndex) {
        if ((previousItem.adsType === 'list' && currentItem.adsType !== 'list') || (previousItem.adsType === 'video' && currentItem.adsType !== 'video')) {
          var flag = true;
          for (let i = currentIndex; i < index + 1; i++) {
            if ((this._ContentService.articleModel.contents[i].adsType === 'list' || this._ContentService.articleModel.contents[i].adsType === 'video') &&
              this._ContentService.articleModel.contents[i].ad_index < previousItem.ad_index
            ) {
              flag = false;
            }
          }
          if (!flag) {
            this._GlobalService.showError('تبلیغ نمی‌تواند به جایگاه غیر مجاز منتقل شود.', 'خطای ترتیب تبلیغات');
            this.dragging = false;
            return;
          }
        }
      }

      else {
        if ((previousItem.adsType === 'list' && currentItem.adsType !== 'list') || previousItem.adsType === 'video' && currentItem.adsType !== 'video') {
          var flag = true;
          for (let i = index + 1; i < currentIndex; i++) {
            if ((this._ContentService.articleModel.contents[i].adsType === 'list' || this._ContentService.articleModel.contents[i].adsType === 'video') &&
              previousItem.ad_index !== this._ContentService.articleModel.contents[i].ad_index
            ) {
              flag = false;
            }
          }
          if (!flag) {
            this._GlobalService.showError('تبلیغ نمی‌تواند به جایگاه غیر مجاز منتقل شود.', 'خطای ترتیب تبلیغات');
            this.dragging = false;
            return;
          }
        }
      }


      this.dragging = false;
      // جابجایی آیتم‌ها اگر مشکلی وجود نداشته باشد
      moveItemInArray(this._ContentService.articleModel.contents, previousIndex, currentIndex);
    }

  }

  moveUp(): void {
    var s_index = this.selected_index;
    if (this.selected_index > 0) {
      // const contents = this._ContentService.articleModel.contents;
      // [contents[this.selected_index], contents[this.selected_index - 1]] = [contents[this.selected_index - 1], contents[this.selected_index]];
      const contents = this._ContentService.articleModel.contents;

      if (this.selected_index > 0) {
        const previousItem = contents[this.selected_index];
        const currentItem = contents[this.selected_index - 1];

        var index = 0;
        for (let i = 0; i < contents.length; i++) {
          if (
            contents[i].adsType === 'list' &&
            contents[i].ad_index === previousItem.ad_index
          ) {
            index = i;
          }
        }

        if (
          (previousItem.adsType === 'list' && currentItem.adsType === 'list') &&
          (previousItem.ad_index < currentItem.ad_index ||
            previousItem.ad_index > currentItem.ad_index)
        ) {
          this._GlobalService.showError(
            'تبلیغ نمی‌تواند به جایگاه غیر مجاز منتقل شود.',
            'خطای ترتیب تبلیغات'
          );
          return;
        } else if (index > this.selected_index - 1) {
          if (previousItem.adsType === 'list' && currentItem.adsType !== 'list') {
            var flag = true;
            for (let i = this.selected_index - 1; i < index + 1; i++) {
              if (
                contents[i].adsType === 'list' &&
                contents[i].ad_index < previousItem.ad_index
              ) {
                flag = false;
              }
            }
            if (!flag) {
              this._GlobalService.showError(
                'تبلیغ نمی‌تواند به جایگاه غیر مجاز منتقل شود.',
                'خطای ترتیب تبلیغات'
              );
              return;
            }
          }
        } else {
          if (previousItem.adsType === 'list' && currentItem.adsType !== 'list') {
            var flag = true;
            for (let i = index + 1; i < this.selected_index - 1; i++) {
              if (
                contents[i].adsType === 'list' &&
                previousItem.ad_index !== contents[i].ad_index
              ) {
                flag = false;
              }
            }
            if (!flag) {
              this._GlobalService.showError(
                'تبلیغ نمی‌تواند به جایگاه غیر مجاز منتقل شود.',
                'خطای ترتیب تبلیغات'
              );
              return;
            }
          }
        }

        // جابجایی آیتم‌ها اگر مشکلی وجود نداشته باشد
        [contents[this.selected_index], contents[this.selected_index - 1]] = [
          contents[this.selected_index - 1],
          contents[this.selected_index],
        ];

        this.selected_index--;
      }
    }


    this.showcomm_editor = false;
    this.showconfigs = false;

    // console.log(this.selected_content);

    // if (this.selected_content.adsType === 'ads')
    //   return;

    if (this._JarrahanGlobalService.show_adsContent) {
      var elem: HTMLElement = document.querySelector('.adhos' + s_index)!;
      elem.style.border = '1px solid #0d6efd'

      setTimeout(() => {
        elem!.scrollIntoView({ block: "center", behavior: "smooth" })
      }, 10);

      setTimeout(() => {
        elem.style.border = 'unset'
      }, 2000);

    }


    else {
      console.log(s_index);
      if (this.selected_content.type === 'ads') {
        const elem: HTMLElement = document.getElementById('adlist' + this.selected_content.ad_index)!;
        this._JarrahanGlobalService.selected_index = s_index - 1;
        this.selected_content.selected = true;
        this.selected_index = s_index - 1;
        this.selected_showindex = s_index - 1;
        this._ContentService.selected_ads_type = this.selected_content.adsType;
        this.ads_selected_index = s_index - 1;
        this.showconfigs = true;
        this.showcomm_editor = true;
        setTimeout(() => {
          elem.scrollIntoView({ block: "center", behavior: "smooth" });
          setTimeout(() => {
            const rect = elem.getBoundingClientRect();
            const scrollY = window.scrollY;
            const absoluteY = rect.top + scrollY;
            this.position.y = absoluteY - 250;
          }, 500);
        }, 10);
      }

      else if (this.selected_content.type === 'template') {
        setTimeout(() => {
          const elem = document.querySelector<HTMLElement>(`[data-template="template${s_index - 1}"]`);
          this._JarrahanGlobalService.selected_index = s_index - 1;
          this.selected_content.selected = true;
          this.selected_index = s_index - 1;
          this.selected_showindex = s_index - 1;
          this._JarrahanGlobalService.selected_ads_index = s_index - 1;
          this.ads_selected_index = s_index - 1;
          this.showconfigs = true;
          this.showcomm_editor = true;
          setTimeout(() => {
            elem!.scrollIntoView({ block: "center", behavior: "smooth" });
            setTimeout(() => {
              const rect = elem!.getBoundingClientRect();
              const scrollY = window.scrollY;
              const absoluteY = rect.top + scrollY;
              this.position.y = absoluteY - 180;
            }, 10);
          }, 10);
        }, 300);
      }


      else {
        var elem: HTMLElement = document.querySelector('.hos' + s_index)!;
        elem.style.border = '1px solid #0d6efd'

        setTimeout(() => {
          elem!.scrollIntoView({ block: "center", behavior: "smooth" })
        }, 10);

        setTimeout(() => {
          elem.style.border = 'unset'
        }, 2000);
      }

    }

  }

  moveDown(): void {
    var s_index = this.selected_index;
    const contents = this._ContentService.articleModel.contents;
    if (this.selected_index < contents.length - 1) {
      // [contents[this.selected_index], contents[this.selected_index + 1]] = [contents[this.selected_index + 1], contents[this.selected_index]];
      if (this.selected_index < contents.length - 1) {
        const previousItem = contents[this.selected_index];
        const currentItem = contents[this.selected_index + 1];

        var index = 0;
        for (let i = 0; i < contents.length; i++) {
          if (
            contents[i].type === 'ads' &&
            contents[i].ad_index === previousItem.ad_index
          ) {
            index = i;
          }
        }

        if (
          (previousItem.type === 'ads' && currentItem.type === 'ads') &&
          (previousItem.ad_index < currentItem.ad_index ||
            previousItem.ad_index > currentItem.ad_index)
        ) {
          this._GlobalService.showError(
            'تبلیغ نمی‌تواند به جایگاه غیر مجاز منتقل شود.',
            'خطای ترتیب تبلیغات'
          );
          return;
        } else if (index < this.selected_index + 1) {
          if (previousItem.type === 'ads' && currentItem.type !== 'ads') {
            var flag = true;
            for (let i = index; i <= this.selected_index + 1; i++) {
              if (
                contents[i].type === 'ads' &&
                contents[i].ad_index > previousItem.ad_index
              ) {
                flag = false;
              }
            }
            if (!flag) {
              this._GlobalService.showError(
                'تبلیغ نمی‌تواند به جایگاه غیر مجاز منتقل شود.',
                'خطای ترتیب تبلیغات'
              );
              return;
            }
          }
        } else {
          if (previousItem.type === 'ads' && currentItem.type !== 'ads') {
            var flag = true;
            for (let i = this.selected_index + 1; i < index; i++) {
              if (
                contents[i].type === 'ads' &&
                previousItem.ad_index !== contents[i].ad_index
              ) {
                flag = false;
              }
            }
            if (!flag) {
              this._GlobalService.showError(
                'تبلیغ نمی‌تواند به جایگاه غیر مجاز منتقل شود.',
                'خطای ترتیب تبلیغات'
              );
              return;
            }
          }
        }

        // جابجایی آیتم‌ها اگر مشکلی وجود نداشته باشد
        [contents[this.selected_index], contents[this.selected_index + 1]] = [
          contents[this.selected_index + 1],
          contents[this.selected_index],
        ];

        this.selected_index++;
      }
    }

    this.showcomm_editor = false;
    this.showconfigs = false;


    // if (this.selected_content.type === 'ads')
    //   return;



    if (this._JarrahanGlobalService.show_adsContent) {
      var elem: HTMLElement = document.querySelector('.adhos' + s_index)!;
      elem.style.border = '1px solid #0d6efd'

      setTimeout(() => {
        elem!.scrollIntoView({ block: "center", behavior: "smooth" })
      }, 10);

      setTimeout(() => {
        elem.style.border = 'unset'
      }, 2000);

    }


    else {
      // console.log(s_index);
      if (this.selected_content.type === 'ads') {
        var elem: HTMLElement = document.getElementById('adlist' + this.selected_content.ad_index)!;
        this._JarrahanGlobalService.selected_index = s_index + 1;
        this.selected_content.selected = true;
        this.selected_index = s_index + 1;
        this.selected_showindex = s_index + 1;
        this._ContentService.selected_ads_type = this.selected_content.adsType;
        this.ads_selected_index = s_index + 1;
        this.showconfigs = true;
        this.showcomm_editor = true;
        setTimeout(() => {
          elem.scrollIntoView({ block: "center", behavior: "smooth" });
          setTimeout(() => {
            const rect = elem.getBoundingClientRect();
            const scrollY = window.scrollY;
            const absoluteY = rect.top + scrollY;
            this.position.y = absoluteY - 250;
          }, 500); // زمان کافی برای پایان انیمیشن smooth
        }, 10);
      }

      else if (this.selected_content.type === 'template') {
        setTimeout(() => {
          const elem = document.querySelector<HTMLElement>(`[data-template="template${s_index + 1}"]`);
          this._JarrahanGlobalService.selected_index = s_index + 1;
          this.selected_content.selected = true;
          this.selected_index = s_index + 1;
          this.selected_showindex = s_index + 1;
          this._JarrahanGlobalService.selected_ads_index = s_index + 1;
          this.ads_selected_index = s_index + 1;
          this.showconfigs = true;
          this.showcomm_editor = true;
          setTimeout(() => {
            elem!.scrollIntoView({ block: "center", behavior: "smooth" });
            setTimeout(() => {
              const rect = elem!.getBoundingClientRect();
              const scrollY = window.scrollY;
              const absoluteY = rect.top + scrollY;
              this.position.y = absoluteY - 180;
            }, 10);
          }, 10);
        }, 300);
      }


      else {
        var elem: HTMLElement = document.querySelector('.hos' + s_index)!;
        elem.style.border = '1px solid #0d6efd'

        setTimeout(() => {
          elem!.scrollIntoView({ block: "center", behavior: "smooth" })
        }, 10);

        setTimeout(() => {
          elem.style.border = 'unset'
        }, 2000);
      }
    }
  }

  // Method to get the appropriate CSS class for an item based on its status
  public getClass(item: any) {
    let classes = '';

    if (!item.show_sub && item.status) {
      classes = 'draggable-item it a'; // Active item without sub-items
    } else if (item.show_sub && !item.status) {
      classes = 'draggable-item it a dis'; // Active item with sub-items but marked as disabled
    } else if (!item.show_sub && !item.status) {
      classes = 'draggable-item it dis'; // Inactive item without sub-items
    } else {
      classes = 'draggable-item it'; // Default class for active items
    }

    if (item.type === 'template') {
      classes += ' ck-content';
    }

    return classes;
  }


  // Check if a specific type has a static definition
  haveRemove(type?: string) {
    return staticContents.findIndex(x => x.type === type); // Returns index of type if found, -1 if not
  }
  // Method to open the delete confirmation box

  remove(event?: any) {
    this.showTiming = false;
    this.close_lock_box();
    this.opendel_box = !this.opendel_box;
    if (this.opendel_box)
      // this.selectedindex = id; // Store the index of the item to be deleted
      this.open_delete_box(event.clientX - 260, event.clientY - 520 + 'px'); // Open delete box at the given position

    else
      this.close_delete_box();

  }

  // Position the delete box near the mouse pointer
  open_delete_box(x: any, y: any) {
    let el = this.delete_box?.nativeElement; // Reference to the delete box element
    // el.style.left = x; // Set the horizontal position
    // el.style.top = y; // Set the vertical position
    el.style.display = 'block'; // Make the delete box visible
  }

  edit(item: any, i: any) {
    // Set the index of the selected item and the selected item type
    this._ContentService.selectedindex = i;
    this.selectedType = item;
    this.edited = true; // Indicate that an edit operation is being performed
    this.show_modal = true; // Display the modal for editing
    this.showeditor = false; // Hide the editor in this context

    // Check if the item type exists in the staticContents array
    if (staticContents.findIndex(x => x.type === item.type) >= 0) {
      this.isstatic = true; // Set isstatic to true if the type is found in staticContents
      // Retrieve the title and content from the article model matching the given type
      this.title = this._ContentService.articleModel.contents.find(x => x.type === item.type)!.title;
      this.content = this._ContentService.articleModel.contents.find(x => x.type === item.type)!.content;
    } else {
      this.isstatic = false; // Set isstatic to false if the type is not found in staticContents
      // Retrieve the title and content from the article model matching the given type
      this.title = this._ContentService.articleModel.contents.find(x => x.type === item.type)!.title;
      this.content = this._ContentService.articleModel.contents.find(x => x.type === item.type)!.content;
    }

    // Set the content to show in the editor or modal
    this.showcontent = this.content;
  }

  status_change(e: any, i?: any) {
    this.selected_content.status = e;
  }

  close_delete_box() {
    this.opendel_box = false;
    // Close the delete confirmation box by setting its display style to 'none'
    let el = this.delete_box?.nativeElement; // Reference the delete box element
    el.style.display = 'none'; // Hide the element
  }

  confirm_del() {
    // Remove the selected content item from the article model at the specified index
    this._ContentService.articleModel.contents.splice(this.selected_index, 1);
    this.close_delete_box(); // Close the delete box after deletion
    this.showconfigs = false;
    this.showcomm_editor = false;
    this.adsshowcomm_editor = false;
    this.adsshowconfigs = false;
    this._GlobalService.showSuccess('با موفقیت حذف شد!')
  }

  // clock() {
  //   this.close_delete_box();
  //   this.close_lock_box();
  //   this.showTiming = !this.showTiming;
  //   if (this.showTiming) {
  //     var date = this.selected_content.publishAt;
  //     this.date = new FormControl(this.selected_content.publishAt);

  //     this.timeformGroup.patchValue({
  //       'time': new Date(date)
  //     })

  //     this.h2find()
  //   }
  // }


  @ViewChild('timingBox') timingBoxTemplate!: TemplateRef<any>;
  @ViewChild('timingContainer', { read: ViewContainerRef }) timingContainer!: ViewContainerRef;
  clock() {
    this.close_delete_box();
    this.close_lock_box();

    // پاک‌سازی قبلی
    this.timingContainer.clear();

    if (!this.showTiming) {
      this.showTiming = true;

      // نمایش دستی باکس
      const viewRef = this.timingContainer.createEmbeddedView(this.timingBoxTemplate);

      // باید صبر کنیم تا DOM واقعاً ساخته بشه
      setTimeout(() => {
        const el = document.querySelector('.timing') as HTMLElement;
        if (el) {
          const rect = el.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          const spaceBelow = windowHeight - rect.bottom;
          const spaceAbove = rect.top;
          const shouldOpenUp = spaceBelow < 200 && spaceAbove > spaceBelow;

          if (shouldOpenUp) {
            el.style.bottom = '60px';
          } else {
            el.style.top = '60px';
          }
        }
      });

      // مقداردهی تاریخ
      let date = this.selected_content.publishAt;

      // اگر نوع محتوا template است و publishAt ندارد → تاریخ پیش‌فرض بده
      if (this.selected_content.type === "template" && !date) {
        date = new Date().toISOString(); // یا هر تاریخ دلخواه دیگری
        this.selected_content.publishAt = date; // ذخیره برای فرم و ادامه کار
      }

      this.date = new FormControl(date);

      this.timeformGroup.patchValue({
        'time': new Date(date)
      });

      this.h2find();
    } else {
      this.showTiming = false;
    }
  }


  private subscription: Subscription = new Subscription();
  private ChangeSubject: Subject<void> = new Subject();
  // addsList: any[] = [];
  // ad_addsList: any[] = [];
  ngOnInit() {
    // this.updateAdsList();
    this.init_editor();
    setTimeout(() => {
      for (let i = 0; i < this._ContentService.articleModel.contents.length; i++) {
        // this.addsList.push(
        //   {
        //     menuOpen: false,
        //     index: i,
        //     btnshow: false
        //   }
        // )
      }
    }, 2000);

    this.subscription.add(
      this.ChangeSubject.pipe(debounceTime(1000)) // 1000 میلی‌ثانیه تاخیر
        .subscribe(() => this.editor_change())
    );
  }
  editor_change() {
    this._ContentService.articleModel.contents[this.current_index].content = this.currentData;
  }

  init_editor() {
    // var types = JSON.parse(localStorage.getItem('image_allowed_suffix')!);
    this.config = {
      toolbar: {
        items: [
          'undo',
          'redo',
          '|',
          'heading',
          '|',
          'bold',
          'customstyle',
          'link',
          '|',
          'insertImage',
          'videoInsert',
          'mediaEmbed',
          'audioInsert',
          // 'uploadFile',
          '|',
          'bulletedList',
          'numberedList',
          'findAndReplace',
          // 'sourceEditing',
          '|',
          'htmlEmbed',
          'horizontalLine',
          'outdent',
          'indent',
          '|',
          'blockQuote',
          'customContent',
          'codeBlock',
          'insertTable',
          '|',
          'alignment',
          '|',
          'fontSize',
          'fontFamily',
          'fontColor',
          'fontBackgroundColor',
          '|',
          'preview',
          'fullScreen'
        ],
        // shouldNotGroupWhenFull: true,
      },
      audio: {
        upload: {
          types: ['mp3', 'avi', 'mkv', 'mov'],
          allowMultipleFiles: false,
        },
        styles: [
          'alignLeft', 'alignCenter', 'alignRight'
        ],
        toolbar: [
          'audioStyle:alignLeft', 'audioStyle:alignCenter', 'audioStyle:alignRight',
          '|',
        ],
      },
      heading: {
        options: [
          { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
          { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
          { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
          { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
          { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
          { model: 'heading5', view: 'h5', title: 'Heading 5', class: 'ck-heading_heading5' },
          { model: 'heading6', view: 'h6', title: 'Heading 6', class: 'ck-heading_heading6' },
        ]
      },
      balloonToolbar: ['bold', 'italic', 'link', '|', 'undo', 'redo'],
      link: {
        decorators: {
          isDownloadable: {
            mode: 'manual',
            label: 'Downloadable',
            attributes: {
              download: 'download'
            }
          },
          // isfollow: {
          //   mode: 'manual',
          //   label: 'Follow',
          //   attributes: {
          //     rel: 'follow'
          //   }
          // },
          openInNewTab: {
            mode: 'manual',
            label: 'Open in a new tab',
            attributes: {
              target: '_blank'
            }
          },
          isnofollow: {
            mode: 'manual',
            label: 'noFollow',
            attributes: {
              rel: 'no follow'
            }
          },
        },
        addTargetToExternalLinks: true,
        defaultProtocol: 'https://',
      },
      fontSize: {
        options: [
          10,
          12,
          14,
          16,
          18,
          20,
          22,
          24
        ]
      },
      simpleUpload: {
        // The URL that the images are uploaded to.
        uploadUrl: environment.apiUrl + "/content/image",
        videouploadUrl: environment.apiUrl + "/content/video/small",
        audioUploadUrl: environment.apiUrl + "/content/video/small",
        withCredentials: true
      },
      image: {
        resizeOptions: [
          {
            name: 'resizeImage:original',
            value: null,
            label: 'Original'
          },
          {
            name: 'resizeImage:40',
            value: '40',
            label: '40%'
          },
          {
            name: 'resizeImage:60',
            value: '60',
            label: '60%'
          }
        ],
        toolbar: [
          'imageStyle:alignRight',
          'imageStyle:alignCenter',
          'imageStyle:alignLeft',
          '|',
          'toggleImageCaption',
          'imageTextAlternative',
          '|',
          'linkImage',
          'imageSize:lockAspectRatio',
          'imageSize:width',
          'imageSize:height',
          'imageTemplate:RemoveImage',
          '|',
          'imageTemplate:TemplateIcon',
          'imageTemplate:RemoveTemplate',
          'imageTemplate:EditImage',
        ],
        resizeUnit: 'px',
        upload: {
          types: ['jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff']
          // types: types
        }
      },
      iframeEmbed: {
        showPreviews: true,
      },
      imagegallery: {
        resizeOptions: [
          {
            name: 'resizeImage:original',
            value: null,
            label: 'Original'
          },
          {
            name: 'resizeImage:40',
            value: '40',
            label: '40%'
          },
          {
            name: 'resizeImage:60',
            value: '60',
            label: '60%'
          }
        ],
        toolbar: [
          '|',
          'toggleImageGalleryCaption',
          'imageGalleryTextAlternative',
          '|',
          'imageTemplate:RemoveImage'
        ],
        resizeUnit: 'px'
      },
      table: {
        contentToolbar: [
          'tableColumn', 'tableRow', 'mergeTableCells', 'tableCellProperties', 'tableProperties'
        ],
        tableToolbar: ['toggleTableCaption', 'toggleTableRemove']
      },
      simplebox: {
        simpleboxToolbar: [
          'simpleBox:addsimpleboxTemplate',
          'simpleBox:removesimpleboxTemplate',
        ]
      },
      video: {
        upload: {
          types: ['mp4'],
          allowMultipleFiles: false,
        },
        styles: [
          'alignLeft', 'alignCenter', 'alignRight'
        ],
        resizeUnit: 'px',
        // You need to configure the video toolbar, too, so it shows the new style
        // buttons as well as the resize buttons.
        toolbar: [
          'videoStyle:alignLeft', 'videoStyle:alignCenter', 'videoStyle:alignRight',
          '|',
          'videoSize:lockAspectRatio',
          'videoSize:width',
          'videoSize:height',
          'videoTemplate:autoplayVideo',
          'videoTemplate:removeVideo',
          '|',
          'videoTemplate:TemplateIcon',
          'videoTemplate:RemoveTemplate',
          'videoTemplate:EditVideo',
        ],
        // Configure the available video resize options.
      },
      mediaEmbed: {
        previewsInData: true,
      },
      fontFamily: {
        options: [
          'default',
          'Ubuntu, Arial, sans-serif',
          'Ubuntu Mono, Courier New, Courier, monospace',
          'Vazir'
        ],
        supportAllValues: true
      },
      // htmlSupport: {
      //   allow: [
      //     // Enables all HTML features.
      //     {
      //       name: /.*/,
      //       attributes: true,
      //       classes: true,
      //       styles: true,
      //     },
      //   ],
      //   disallow: [
      //     {
      //       attributes: [
      //         { key: /^on(.*)/i, value: true },
      //         {
      //           key: /.*/,
      //           value: /(\b)(on\S+)(\s*)=|javascript:|(<\s*)(\/*)script/i,
      //         },
      //         { key: /.*/, value: /data:(?!image\/(png|jpeg|gif|webp))/i },
      //       ],
      //     },
      //     { name: 'script' },
      //   ],
      // },

      htmlSupport: {
        allow: [
          {
            name: 'span',
            attributes: ['class'], // تعیین ویژگی‌های خاص که مجاز هستند
            classes: ['related_KeyWord_highlight', 'ck-find-result_selected'], // تعیین کلاس‌های خاص
            // styles: ['color', 'font-size'] // تعیین استایل‌های خاص
          },
          {
            name: 'img',
            attributes: true,
            classes: true,
            styles: true
          },
          // {
          //   name: 'audio',
          //   attributes: true,
          //   classes: true,
          //   styles: true
          // },
        ]
      },

      highlight: {
        options: [
          {
            model: 'greenMarker',
            class: 'marker-green',
            title: 'Green marker',
            color: 'var(--ck-highlight-marker-green)',
            type: 'marker'
          },
          {
            model: 'redPen',
            class: 'pen-red',
            title: 'Red pen',
            color: 'var(--ck-highlight-pen-red)',
            type: 'pen'
          }
        ]
      },
      language: 'fa',
    };
  }

  classicReady(editor: any) {
    editor.model.document.on('change:data', () => {
      this.content2 = editor.getData();
    });
  }
  //#region menu

  isshowbtn(index: any) {
    return this._ContentService.articleModel.contents[index]?.btnshow;
  }

  isopen(index: any) {
    return this._ContentService.articleModel.contents[index]?.menuOpen;
  }

  menuout() {
    this._ContentService.articleModel.contents.forEach(element => {
      element.menuOpen = false;
    });
  }

  hide_all() {
    this.selected_ads = -1;

    if (this.overtoolbar)
      return;

    this._ContentService.articleModel.contents.forEach(element => {
      element.btnshow = false;
      element.menuOpen = false;
    });

    for (let i = 0; i < this._ContentService.articleModel.contents.length; i++) {
      const valu: any = document.querySelector('.hos' + i + ' .ck-content');
      if (valu)
        this._ContentService.articleModel.contents[i].content = valu.innerHTML;
    }

    // فقط اولین محتوای خالی‌ای که نوعش ads نیست رو حذف کن
    const findedEmpty = this._ContentService.articleModel.contents.findIndex(
      x =>
        (x.content === '' ||
          x.content === null ||
          x.content?.trim() === '<p><br data-cke-filler="true"></p>') &&
        x.type !== 'ads'
    );

    if (findedEmpty !== -1) {
      this._ContentService.articleModel.contents.splice(findedEmpty, 1);
    }
  }


  hideall(index: any) {
    if (this._ContentService.articleModel.contents[index]?.menuOpen)
      return;
    this._ContentService.articleModel.contents.forEach(element => {
      element.btnshow = false;
    });
  }

  showbtn(index: any) {
    this._ContentService.articleModel.contents.forEach(element => {
      element.btnshow = false;
    });
    if (this._ContentService.articleModel.contents[index])
      this._ContentService.articleModel.contents[index].btnshow = !this._ContentService.articleModel.contents[index]?.btnshow;
  }

  toggleMenu(event: MouseEvent, index: any) {
    this._ContentService.selectedindex = index;
    this._ContentService.articleModel.contents[index].menuOpen = !this._ContentService.articleModel.contents[index].menuOpen;
    if (this._ContentService.articleModel.contents[index]?.menuOpen) {
      const button = event.target as HTMLElement;
      const rect = button.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // بررسی اینکه آیا منو باید به سمت بالا باز شود یا پایین
      this._ContentService.openUp = rect.bottom + 200 > viewportHeight; // اگر فضای کافی برای پایین وجود ندارد، به بالا باز شود.
    }
  }

  browseAll() {
    alert('Browse all clicked!');
  }

  @HostListener('document:click', ['$event.target'])
  onClickOutside(target: HTMLElement) {
    if (!this.elementRef.nativeElement.contains(target)) {
      this.menuOpen = false;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // اگر کلیک بیرون بود، selectedFutureIndex رو ریست کن
    this.selectedFutureIndex = null;
  }


  firstmenuOpen: boolean = false;
  toggleMenu1(event: MouseEvent) {
    this._ContentService.selectedindex = this._ContentService.articleModel.contents.length;
    // this.menuout();
    this.menuOpen = !this.menuOpen;
    if (this.menuOpen) {
      const button = event.target as HTMLElement;
      const rect = button.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      this._ContentService.openUp = rect.bottom + 200 > viewportHeight;
    }
  }

  toggleMenuFirst(event: MouseEvent) {
    this._ContentService.selectedindex = this._ContentService.articleModel.contents.length;
    // this.menuout();
    this.firstmenuOpen = !this.firstmenuOpen;
    if (this.menuOpen) {
      const button = event.target as HTMLElement;
      const rect = button.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      this._ContentService.openUp = rect.bottom + 200 > viewportHeight;
    }
  }
  //#endregion

  blocktype: string = '';
  moveBox(event: MouseEvent, item: any, index: number, fromads: boolean = false): void {
    event.stopPropagation(); // اضافه کردن برای جلوگیری از انتشار به document

    const now = new Date();
    const publishDate = new Date(item.publishAt);
    const isFuture = publishDate.getTime() > now.getTime();

    // اگر آیتم future است، انتخابش کن
    this.selectedFutureIndex = isFuture ? index : null;

    // بقیه کد قبلی
    this.blocktype = item.type;
    this.selected_all = false;
    if (item.type === 'ads') {
      this._ContentService.selected_ads_type = item.adsType;
      this.ads_selected_index = index;
    }
    this._JarrahanGlobalService.selected_index = index;
    if (item.setting)
      this._JarrahanGlobalService.selected_position = item.setting.index;

    this.selected_content = item;
    this._JarrahanGlobalService.selected_template = item;
    const date = this.selected_content.publishAt;
    this.date = new FormControl(this.selected_content.publishAt);
    this.timeformGroup.patchValue({ 'time': new Date(date) });
    this.selected_index = index;
    this.selected_showindex = index;
    if (!fromads)
      this.showconfigs = true;
    this.showcomm_editor = true;
    this.position = { x: event.pageX - 250, y: event.pageY - 200 };
  }

  newblock_content(index?: any, type: string = 'content') {
    this.reset_showcontent();
    if (index !== undefined) this._ContentService.selectedindex = index;

    for (let i = 0; i < this._ContentService.articleModel.contents.length; i++) {
      let valu: any = document.querySelector('.hos' + i + ' .ck-content');
      if (valu) this._ContentService.articleModel.contents[i].content = valu.innerHTML;
    }

    // if (this._ContentService.articleModel.contents.some(x => x.content === '' || x.content === '<p><br data-cke-filler="true"></p>')) {
    //   return;
    // }

    let value: string = index !== undefined ? this.middletitle : this.blocktitle;

    let model = {
      type: type,
      title: value,
      content: value,
      status: true,
      publishAt: new Date().toISOString().split("T")[0] + ' ' + new Date().toISOString().split("T")[1],
      comments: [],
      iscycle: false,
      opencycle: false,
      cycleTitle: '',
      showTiming: false,
    };

    let insertIndex = this._ContentService.selectedindex + 1; // درج بعد از ایندکس انتخاب‌شده در لیست فیلتر شده
    // console.log(insertIndex);

    this._ContentService.articleModel.contents.splice(insertIndex, 0, model);

    this.content2 = '';
    this.show_modal = false;
    this.blocktitle = '';
    this.middletitle = '';
    this.show_middle = false;

    setTimeout(() => {
      const editorInstances = this.ckeditorRefs.toArray();
      var count = 0;
      for (let i = 0; i < index + 1; i++) {
        if (this._ContentService.articleModel.contents[i].type === 'ads')
          count += 1;
      }
      insertIndex = insertIndex - count;
      // چک کن که ادیتور در این ایندکس وجود داره
      if (insertIndex !== -1 && editorInstances[insertIndex]) {
        const editorInstance = editorInstances[insertIndex].editorInstance;
        editorInstance.editing.view.focus();
      } else {
        console.error(`Editor instance at index ${insertIndex} not found.`);
      }
    }, 50);
  }



  cleanHtml(html: string): string {
    if (!html) return '';

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // پیدا کردن و حذف دقیق div هایی که کلاس‌های CKEditor دارند
    doc.querySelectorAll('div.ck-reset_all, div.ck-widget__type-around, div.ck').forEach(el => el.remove());

    return doc.body.innerHTML;
  }

  toggle_minus: boolean = false;
  reset_showcontent() {
    this._JarrahanGlobalService.show_content_template = false
    this._ContentService.articleModel.contents.forEach(element => {
      element.show_content = false;
    });
  }


  toggle_toggle_minus() {
    this.toggle_minus = !this.toggle_minus;
    // if (this.toggle_minus) {
    //   this._JarrahanGlobalService.show_content_template = false
    //   this._ContentService.articleModel.contents.forEach(element => {
    //     element.show_content = false;
    //   });
    // }

    // else {
    //   this._JarrahanGlobalService.show_content_template = false
    //   for (let i = 0; i < this._ContentService.articleModel.contents.length; i++) {
    //     this._ContentService.articleModel.contents[i].show_content = true;
    //   }
    // }
  }

  newblock_ads(index: any, type: string) {
    if (index) {
      this._ContentService.selectedindex = index;
    }

    var model: any = {
      type: 'ads',
      adsType: type,
      title: '',
      status: true,
      publishAt: new Date().toISOString().split("T")[0] + ' ' + new Date().toISOString().split("T")[1],
      comments: [],
      iscycle: false,
      opencycle: false,
      cycleTitle: '',
      showTiming: false,
      contents: [],
      backups: [],
      show_content: false,
      setting: {
        index: 0,
        percent: 0,
        type: 'simple',
        availableMonth: this.ads_configs.availableMonth,
        enabled: true,
        onlyPaid: false,
        payPercent: 0,
        backups: [],
      }
    };

    if (type === 'special') {
      const firstSpecialWithSetting = this._ContentService.articleModel.contents.find(
        element => element.adsType === 'special' && !!element.setting
      );

      if (firstSpecialWithSetting) {
        // می‌تونی بهش دسترسی داشته باشی
        // console.log('مورد پیدا شده:', firstSpecialWithSetting);
        model.setting =
        {
          index: 0,
          percent: firstSpecialWithSetting.setting.percent,
          type: 'simple',
          availableMonth: firstSpecialWithSetting.setting.availableMonth,
          enabled: true,
          onlyPaid: false,
          payPercent: firstSpecialWithSetting.setting.payPercent,
          backups: firstSpecialWithSetting.setting.backups,
        }
      }
    }



    var numberof_ads_list = 1;
    // if (type === 'ads') {
    for (let i = 0; i < this._ContentService.articleModel.contents.length; i++) {
      if (this._ContentService.articleModel.contents[i].adsType === type)
        numberof_ads_list += 1;
    }
    model.ad_index = numberof_ads_list;
    model.setting.index = numberof_ads_list;
    // }

    let lastAdsIndex = -1;
    for (let i = 0; i < this._ContentService.articleModel.contents.length; i++) {
      if (this._ContentService.articleModel.contents[i].adsType === type) {
        lastAdsIndex = i;
      }
    }

    let insertIndex;
    if (this._ContentService.selectedindex !== undefined) {
      insertIndex = this._ContentService.selectedindex + 1;
    } else {
      insertIndex = lastAdsIndex !== -1 ? lastAdsIndex + 1 : this._ContentService.articleModel.contents.length;
    }

    if (lastAdsIndex !== -1 && insertIndex <= lastAdsIndex) {
      insertIndex = lastAdsIndex + 1;
    }

    this._ContentService.articleModel.contents.splice(insertIndex, 0, model);


    this.show_modal = false;
    this.show_middle = false;
    this.menuout();


    var text = 'جایگاه تبلیغاتی ' + numberof_ads_list + ' با موفقیت اضافه شد ';
    this._GlobalService.showSuccess(text)
    setTimeout(() => {
      var elem = document.getElementById('adlist' + numberof_ads_list);
      if (elem)
        elem!.scrollIntoView({ block: "center", behavior: "smooth" })
    }, 10);


    // console.log(this._ContentService.articleModel.contents);



  }


  lockonlock(event?: any) {
    this.showTiming = false;
    this.close_delete_box();
    this.openlock_box = !this.openlock_box;
    if (this.openlock_box)
      this.open_lock_box(); // Open delete box at the given position

    else
      this.close_delete_box();

  }

  // Position the delete box near the mouse pointer
  open_lock_box() {
    let el = this.lockbox?.nativeElement; // Reference to the delete box element
    el.style.display = 'block'; // Make the delete box visible
  }
  close_lock_box() {
    this.openlock_box = false;
    // Close the delete confirmation box by setting its display style to 'none'
    let el = this.lockbox?.nativeElement; // Reference the delete box element
    el.style.display = 'none'; // Hide the element
  }

  confirm_lock_box() {
    this.close_lock_box(); // Close the delete box after deletion
    this._ContentService.articleModel.contents[this.selected_index].lock = !this._ContentService.articleModel.contents[this.selected_index].lock;
  }

  ads_confirm_lock_box() {
    this.close_lock_box(); // Close the delete box after deletion
    this.tcurrentAdsList[this.ads_selected_index].lock = !this.currentAdsList[this.ads_selected_index].lock;
  }

  get ads_currentLock() {
    return this.tcurrentAdsList[this.ads_selected_index].lock;
  }

  changeDateFormatPublishDate(event: any): void {
    let value = event.target.value;
    if (value !== '') {
      this.publishDate = moment.from(value, 'fa', 'YYYY/MM/DD').locale('en').format('YYYY-MM-DD');
    }
  }

  outclick() {
    if (document.querySelector('.mat-datepicker-popup') === null && document.querySelector('.ngx-mat-timepicker') === null) {
      this.showconfigs = false;
      this.showcomm_editor = false;
      this.adsshowcomm_editor = false;
      this.adsshowconfigs = false;
      this.showconfigBox = false;
      this.showcommentBox = false;
      this.showTiming = false;
    }
  }

  public timeformGroup = new FormGroup({
    time: new FormControl(new Date(), [Validators.required])
  });

  get get_time_value() {
    let dateValue: any = this.timeformGroup.get('time')?.value;
    let date: Date | null = null;

    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      date = new Date(dateValue);
    }

    if (date && !isNaN(date.getTime())) {
      let hours = ("0" + date.getHours()).slice(-2);
      let minutes = ("0" + date.getMinutes()).slice(-2);
      return hours + ':' + minutes;
    } else {
      return "Invalid time";
    }
  }

  change_time() {
    // this._ContentService.articleModel.contents[this.selected_index].publishAt = this.publishDate + ' ' + this.get_time_value + ':00';
    this.selected_content.publishAt = this.publishDate + ' ' + this.get_time_value + ':00';

    this.showTiming = false;
    this.showTimingContents();
  }

  showcommentBox: boolean = false;
  showcomment(event: MouseEvent) {
    this.box1position = { x: event.pageX - 250, y: event.screenY - 800 }; // استفاده از مختصات مطلق
    this.showcommentBox = !this.showcommentBox;
  }

  isemptyComment(): number {
    // return this._ContentService.articleModel.contents[this.selected_index]?.comments?.length;
    return this.selected_content?.comments?.length;
  }

  submitComment() {
    // console.log(this.selected_content);

    if (this.comment.text === '')
      return
    this.comment.date = new Date().toISOString().split("T")[0] + 'T' + new Date().toISOString().split("T")[1];
    // this.comment.date=  moment.from(this.comment.date, 'fa', 'YYYY/MM/DD').locale('en').format('YYYY-MM-DD');
    this.comment.admin.profile = this.userInfo.image;
    this.comment.admin.name = this.userInfo.name;
    this.comment.admin.familyName = this.userInfo.familyName;
    // this._ContentService.articleModel.contents[this.selected_index]?.comments.push(this.comment)
    this.selected_content?.comments.push(this.comment)

    this.comment = {
      text: '',
      date: '',
      reply: '',
      admin: {
        profile: '',
        familyName: '',
        name: '',
      }
    }
  }

  currentComments(): any[] {
    return this._ContentService.articleModel.contents[this.selected_index]?.comments;
  }

  toggleEdit(item: any) {
    if (item.isedit)
      item.isedit = !item.isedit

    else
      item.isedit = true;
  }

  removeComment(item: any, index: any) {
    this._ContentService.articleModel.contents[this.selected_index]?.comments.splice(index, 1)
  }

  submitEdit(item: any, index: any) {
    var finded = this._ContentService.articleModel.contents[this.selected_index]?.comments[index];
    finded.date = new Date().toISOString().split("T")[0] + 'T' + new Date().toISOString().split("T")[1];
    finded.text = item.text;
    item.isedit = false;
  }


  h2find() {
    for (let i = 0; i < this._ContentService.articleModel.contents.length; i++) {
      var value: any = document.querySelector('.hos' + i + ' .ck-content');
      if (value)
        this._ContentService.articleModel.contents[i].content = value.innerHTML;
    }

    var content = this._ContentService.articleModel.contents[this.selected_index].content;
    // تبدیل رشته به عنصر HTML برای جستجو
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');

    // پیدا کردن اولین تگ h2
    const firstH2 = doc.querySelector('h2');

    if (firstH2) {
      this._ContentService.articleModel.contents[this.selected_index].title = firstH2.innerText;
    } else {
    }

  }

  @ViewChildren('ckeditor') ckeditorRefs!: QueryList<any>;
  newblock_content2(index?: any, type: string = 'content') {
    this.reset_showcontent();
    this.menuOpen = false;
    if (index !== undefined) this._ContentService.selectedindex = index;

    for (let i = 0; i < this._ContentService.articleModel.contents.length; i++) {
      const el = document.querySelector('.hos' + i);
      if (el && !el.classList.contains('ads-moh')) {
        const valu: any = el.querySelector('.ck-content');
        if (valu) {
          this._ContentService.articleModel.contents[i].content = valu.innerHTML;
        }
      }
    }

    // if (this._ContentService.articleModel.contents.some(x => x.content === '' || x.content === '<p><br data-cke-filler="true"></p>')) {
    //   return;
    // }

    let value: string = index !== undefined ? this.middletitle : this.blocktitle;
    let model = {
      type: type,
      title: value,
      content: value,
      status: true,
      publishAt: new Date().toISOString().split("T")[0] + ' ' + new Date().toISOString().split("T")[1],
      comments: [],
      iscycle: false,
      opencycle: false,
      cycleTitle: '',
      showTiming: false,
    };

    let filteredContents = this._ContentService.articleModel.contents.filter(item => item.type !== 'ads');
    let lastIndex = filteredContents.length; // آخرین ایندکس برای اضافه کردن    
    this._ContentService.articleModel.contents.push(model);
    this.editorInstances[lastIndex] = null;
    this.content2 = '';
    this.show_modal = false;
    this.blocktitle = '';
    this.middletitle = '';
    this.show_middle = false;

    setTimeout(() => {
      const editorInstances = this.ckeditorRefs.toArray();
      let realIndex = this._ContentService.articleModel.contents.findIndex(x => x === model);


      let adsCount = this._ContentService.articleModel.contents
        .slice(0, realIndex)
        .filter(x => x.type === 'ads').length;

      realIndex -= adsCount;
      if (realIndex !== -1 && editorInstances[realIndex]) {
        const editorInstance = editorInstances[realIndex].editorInstance;
        if (editorInstance && editorInstance.editing && editorInstance.editing.view) {
          editorInstance.editing.view.focus();
        }

      } else {
        console.error(`Editor instance at index ${realIndex} not found.`);
      }
    }, 50);
  }

  currentTitle() {
    // return this._ContentService.articleModel.contents[this.selected_index].title;
    return this.selected_content.title;

  }
  changeTitle(e: any) {
    // this._ContentService.articleModel.contents[this.selected_index].title = e.target.value;
    this.selected_content.title = e.target.value;
  }

  // زمانی که ویرایشگر آماده است
  onReady(editor: any, index: number) {
    try {
      // بررسی اینکه editor معتبره
      if (!editor || !editor.model || !editor.ui) {
        console.warn('Editor is not ready yet.');
        return;
      }

      this.editorInstance = editor;

      // بررسی وجود محتوا قبل از setData
      const contentItem = this._ContentService?.articleModel?.contents?.[index];
      if (contentItem && contentItem.content !== undefined) {
        editor.setData(contentItem.content);
      } else {
        console.warn('Content not found for index:', index);
        editor.setData('');
      }

      // listener با debounce مطمئن
      let timeout: any;
      editor.model.document.on('change:data', (evt: any) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          if (this.mixContent) this.mixContent();
        }, 500);

        if (!this.editorInstance?.model) {
          evt.stop();
        }
      });

      // بررسی toolbar قبل از دسترسی
      const toolbarElement = editor.ui?.view?.toolbar?.element;
      if (toolbarElement) {
        this.overtoolbar = false;

        toolbarElement.addEventListener('click', (event: MouseEvent) => {
          event.stopPropagation();
          this.overtoolbar = true;
        });

        toolbarElement.addEventListener('mousemove', (event: MouseEvent) => {
          event.stopPropagation();
          this.overtoolbar = true;
        });

        toolbarElement.addEventListener('mouseleave', () => {
          this.overtoolbar = false;
        });
      } else {
        console.warn('Toolbar not found on editor instance.');
      }
    } catch (error) {
      console.error('Error in onReady:', error);
    }
  }


  onOutsideClick() {
    if (this.editorInstance) {
      this.editorInstance.isReadOnly = true;
    }
  }

  enableEditor() {
    if (this.editorInstance) {
      this.editorInstance.isReadOnly = false;
    }
  }

  destroyEditor() {
    if (this.editorInstance) {
      this.editorInstance.destroy()
        .then(() => {
          this.editorInstance = null;
        })
        .catch((err: any) => console.error('Error destroying editor:', err));
    }
  }

  disableEditor() {
    if (this.editorInstance) {
      // غیرفعال کردن ویرایشگر
      this.editorInstance.isReadOnly = true;
    }
  }

  select_cycle(item: any) {
    this._ContentService.articleModel.contents[this.selected_index].opencycle = false;
    this._ContentService.articleModel.contents[this.selected_index].cycleTitle = item.name;
    this._ContentService.articleModel.contents[this.selected_index].cycle = item._id;
  }

  cycle_change(e: any) {
    var value = e.target.value;
    if (value === '') {
      this._ContentService.articleModel.contents[this.selected_index].opencycle = false;
      return;
    }
    else
      var paramObj = "name$reg=" + value;
    this._PublicService.get_all('/publish-cycles?', paramObj)
      .subscribe((data: any) => {
        this.cycleList = data.data.list;
      },
        (err: any) => {
          this._GlobalService.parseError(err);
        }
      );
  }

  get_ads_setting() {
    var paramObj = "pageType=" + 'article';
    this._PublicService.get_all('/jarahan/ads/setting/filter?', paramObj)
      .subscribe((data: any) => {
        this.ads_configs = data.data
      },
        (err: any) => {
          this._GlobalService.parseError(err);
        }
      );
  }

  adsnewContent() {
    this._JarrahanGlobalService.show_adsContent = true;
    this._JarrahanGlobalService.tab_type = '';
    setTimeout(() => {
      this.tryInitializeMaps(); // اگر دوباره شرط true شد، این اجرا می‌شه
    }, 100);
  }

  // ads contetnts 
  new_adsblock_content(index?: any, type: string = 'content') {
    this.firstmenuOpen = false;
    if (index)
      this.ads_selectedindex = index

    if (this._JarrahanGlobalService.ads_tab === 1) {
      for (let i = 0; i < this._ContentService.articleModel.contents[this.selected_index].backups.length; i++) {
        var valu: any = document.querySelector('.adshos' + i + ' .ck-content');
        if (valu)
          this._ContentService.articleModel.contents[this.selected_index].backups[i].content = valu.innerHTML;
      }

      if (this._ContentService.articleModel.contents[this.selected_index].backups.filter((x: { content: string; }) => x.content === '').length > 0
        || this._ContentService.articleModel.contents[this.selected_index].backups.filter((x: { content: string; }) => x.content === '<p><br data-cke-filler="true"></p>').length > 0
      )
        return;
    }


    else if (this._JarrahanGlobalService.ads_tab === 4) {
      for (let i = 0; i < this._ContentService.archive_contents.length; i++) {
        var valu: any = document.querySelector('.adshos' + i + ' .ck-content');
        if (valu)
          this._ContentService.archive_contents[i].content = valu.innerHTML;
      }

      if (this._ContentService.archive_contents.filter((x: { content: string; }) => x.content === '').length > 0
        || this._ContentService.archive_contents.filter((x: { content: string; }) => x.content === '<p><br data-cke-filler="true"></p>').length > 0
      )
        return;
    }

    else if (this._JarrahanGlobalService.ads_tab === 2) {
      for (let i = 0; i < this._ContentService.articleModel.contents[this.selected_index].contents.length; i++) {
        var valu: any = document.querySelector('.adshos' + i + ' .ck-content');
        if (valu)
          this._ContentService.articleModel.contents[this.selected_index].contents[i].content = valu.innerHTML;
      }

      if (this._ContentService.articleModel.contents[this.selected_index].contents.filter((x: { content: string; }) => x.content === '').length > 0
        || this._ContentService.articleModel.contents[this.selected_index].contents.filter((x: { content: string; }) => x.content === '<p><br data-cke-filler="true"></p>').length > 0
      )
        return;
    }

    var value: string;
    if (index !== undefined)
      value = this.middletitle;

    else
      value = this.blocktitle;

    var model = {
      type: type === 'last' ? 'content' : type,
      title: value,
      content: value,
      status: true,
      publishAt: new Date().toISOString().split("T")[0] + ' ' + new Date().toISOString().split("T")[1],
      comments: [],
      iscycle: false,
      opencycle: false,
      cycleTitle: '',
      showTiming: false,
    };


    var templateCount: number = 0;
    if (this._JarrahanGlobalService.ads_tab === 1) {
      templateCount = this._ContentService.articleModel.contents[this.selected_index].backups
        ?.filter((item: any) => item.type === 'template')
        .length || 0;
    }
    if (this._JarrahanGlobalService.ads_tab === 2) {
      templateCount = this._ContentService.articleModel.contents[this.selected_index].contents
        ?.filter((item: any) => item.type === 'template')
        .length || 0;
    }

    let countBeforeTemplate = 0;
    let list: any[] = [];

    if (this._JarrahanGlobalService.ads_tab === 1) {
      list = this._ContentService.articleModel.contents[this.selected_index].backups || [];
    } else if (this._JarrahanGlobalService.ads_tab === 2) {
      list = this._ContentService.articleModel.contents[this.selected_index].contents || [];
    }

    for (let i = 0; i < list.length; i++) {
      if (list[i].type === 'template') {
        break;
      }
      countBeforeTemplate++;
    }

    // Add the new content at a specific position in the list
    var insertIndex: any;
    if (type === 'last')
      insertIndex = this.ads_selectedindex;

    else {
      insertIndex = this.ads_selectedindex + 1;
    }

    if (this._JarrahanGlobalService.ads_tab === 1) {
      this._ContentService.articleModel.contents[this.selected_index].backups.splice(insertIndex, 0, model);
    }

    if (this._JarrahanGlobalService.ads_tab === 4)
      this._ContentService.archive_contents.splice(insertIndex, 0, model);

    else if (this._JarrahanGlobalService.ads_tab === 2) {
      this._ContentService.articleModel.contents[this.selected_index].contents.splice(insertIndex, 0, model);
    }


    function findContentIndex(list: any[]): number {
      let contentIndex = 0;
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (item.type === 'content') {
          if (item.content === '') {
            return contentIndex;
          }
          contentIndex++;
        }
      }
      return -1; // اگر پیدا نشد
    }

    setTimeout(() => {
      if (this._JarrahanGlobalService.ads_tab === 1) {
        const list = this._ContentService.articleModel.contents[this.selected_index].backups;
        insertIndex = findContentIndex(list);
      }

      if (this._JarrahanGlobalService.ads_tab === 2) {
        const list = this._ContentService.articleModel.contents[this.selected_index].contents;
        insertIndex = findContentIndex(list);
      }

      const list = this._ContentService.articleModel.contents[this.selected_index].backups || [];
      const templateIndex = list.findIndex((item: any) => item.type === 'template');
      this.editorInstances[insertIndex] = null;
      this.content2 = '';
      this.show_modal = false; // Close the modal after submission
      // this.mixContent();
      this.blocktitle = '';
      this.middletitle = '';
      this.show_middle = false;


      setTimeout(() => {
        const editorInstances = this.ckeditorRefs.toArray();
        if (editorInstances[insertIndex]) {
          const editorInstance = editorInstances[insertIndex].editorInstance;
          editorInstance.editing.view.focus();
          // console.log(`Editor ${insertIndex + 1} focused`);
        } else {
          // console.error(`Editor instance at index ${insertIndex} is not available`);
        }
      }, 50);

    }, 200);
  }

  adsonReady2(editor: any, item: any, index: number) {
    if (!editor || !item) return;

    this.editorInstance = editor;

    // تعیین مسیر صحیح محتوا
    let rawContent: string | undefined = '';

    try {
      if (item.isAdsFull && item.contents) {
        rawContent =
          this._ContentService.articleModel.contents?.[this.selected_index]?.contents?.[index]?.content || '';
      } else {
        rawContent =
          this._ContentService.articleModel.contents?.[this.selected_index]?.backups?.[index]?.content || '';
      }
    } catch (err) {
      console.warn('Error reading rawContent', err);
      rawContent = '';
    }

    // اگر هیچ محتوایی نیست، ادیتور رو با رشته خالی مقداردهی کن
    if (!rawContent) rawContent = '';

    // اصلاح جای alt در img
    rawContent = rawContent.replace(
      /<img([^>]*?)\salt="(.*?)"([^>]*?)>/g,
      (_match: any, beforeAlt: any, altValue: any, afterAlt: any) => {
        return `<img${beforeAlt}${afterAlt} alt="${altValue}">`;
      }
    );

    // ست کردن به ادیتور (در try-catch برای جلوگیری از خطای CKEditor)
    try {
      editor.setData(rawContent);
    } catch (err) {
      console.error('Error setting data to editor:', err);
    }

    // لیسنر تغییر داده
    try {
      if (editor.model?.document) {
        editor.model.document.on('change:data', (evt: any) => {
          this.mixContent();
          if (!this.editorInstance || !this.editorInstance.model) {
            evt.stop();
            return;
          }
        });
      } else {
        console.warn('Editor model.document is undefined');
      }
    } catch (err) {
      console.error('Error setting up document listener:', err);
    }

    // کنترل رفتار toolbar به‌صورت ایمن
    try {
      const toolbarElement = editor.ui?.view?.toolbar?.element;
      if (!toolbarElement) {
        console.warn('Toolbar element not found');
        return;
      }

      this.overtoolbar = false;

      toolbarElement.addEventListener('click', (event: MouseEvent) => {
        event.stopPropagation();
        this.overtoolbar = true;
      });

      toolbarElement.addEventListener('mousemove', (event: MouseEvent) => {
        this.overtoolbar = true;
        event.stopPropagation();
      });

      toolbarElement.addEventListener('mouseleave', () => {
        this.overtoolbar = false;
      });
    } catch (err) {
      console.error('Error initializing toolbar listeners:', err);
    }
  }



  adsonReady(editor: any, index: any, item?: any) {
    if (!this._ContentService.articleModel.contents[this.selected_index]) return;

    this.editorInstance = editor;

    let rawContent: string | undefined;

    if (this._JarrahanGlobalService.ads_tab === 1) {
      rawContent = this._ContentService.articleModel.contents[this.selected_index]?.backups[index].content;
    } else if (this._JarrahanGlobalService.ads_tab === 4) {
      rawContent = this._ContentService.archive_contents[index].content;
    } else if (this._JarrahanGlobalService.ads_tab === 2) {
      rawContent = this._ContentService.articleModel.contents[this.selected_index]?.contents[index].content;
    }

    // اصلاح تگ‌های <img>: انتقال alt به انتها یا افزودن alt=""
    rawContent = rawContent?.replace(/<img([^>]*?)>/g, (_match, attrs) => {
      const altMatch = attrs.match(/\balt\s*=\s*["'](.*?)["']/);
      const altValue = altMatch ? altMatch[1] : '';
      const cleanedAttrs = attrs.replace(/\balt\s*=\s*["'].*?["']/, '').trim();
      return `<img ${cleanedAttrs} alt="${altValue}">`;
    });

    // ست کردن محتوای اصلاح‌شده به ادیتور
    editor.setData(rawContent || '');

    // لیسنر تغییر محتوا
    editor.model.document.on('change:data', (evt: any) => {
      this.mixContent();
      if (!this.editorInstance || !this.editorInstance.model) {
        evt.stop();
        return;
      }
    });

    // کنترل رفتار تولبار
    const toolbarElement = editor.ui.view.toolbar.element;
    this.overtoolbar = false;

    toolbarElement.addEventListener('click', (event: MouseEvent) => {
      event.stopPropagation();
      this.overtoolbar = true;
    });

    toolbarElement.addEventListener('mousemove', (event: MouseEvent) => {
      this.overtoolbar = true;
      event.stopPropagation();
    });

    toolbarElement.addEventListener('mouseleave', () => {
      this.overtoolbar = false;
    });
    this._LoadingService.hide();

  }


  ads_get_contents(item: any) {

    if (!item)
      return '';

    if (item.isAdsFull && item.contents) {
      // return item.contents.map((item: { content: any; }) => this.cleanHtml(item.content)).join('');
      // console.log(item.contents);
      return this.cleanHtml(item.contents);

    }

    else {
      // console.log(item.backups);
      // return item.backups.map((item: { content: any; }) => this.cleanHtml(item.backups)).join('');
      return this.cleanHtml(item.backups);
    }

    // if (!item.backups || !item.contents)
    //   return '';
    // if (this._JarrahanGlobalService.ads_tab === 1)
    //   return item.backups.map((item: { content: any; }) => this.cleanHtml(item.content)).join('');

    // else
    //   return item.contents.map((item: { content: any; }) => this.cleanHtml(item.content)).join('');
  }

  trackByEditor(index: number, item: any): any {
    return item.id || index; // مطمئن شو item ها یک id یکتا دارن
  }

  selected_ads: number;
  selected_ads_for_move: number;
  adsmoveBox(event: MouseEvent, item: any, index: any): void {
    this.showconfigs = false;
    if (item.type === 'template')
      this.selected_ads = index;
    this.selected_ads_for_move = index;

    this.selected_content = item;
    // this.selected_index = index;
    // this.ads_selected_index = index;
    this.adsshowconfigs = true;
    this.adsshowcomm_editor = true;
    this.position = { x: event.pageX - 250, y: event.pageY - 200 }; // استفاده از مختصات مطلق
  }

  ads_toggleMenu(event: MouseEvent, index: any) {


    this.ads_selectedindex = index;
    // this.ad_addsList[index].menuOpen = !this.ad_addsList[index].menuOpen;
    this._ContentService.articleModel.contents[index].menuOpen = !this._ContentService.articleModel.contents[index].menuOpen;
    if (this._ContentService.articleModel.contents[index].menuOpen) {
      const button = event.target as HTMLElement;
      const rect = button.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // بررسی اینکه آیا منو باید به سمت بالا باز شود یا پایین
      this._ContentService.openUp = rect.bottom + 200 > viewportHeight; // اگر فضای کافی برای پایین وجود ندارد، به بالا باز شود.
    }
  }

  ads_toggleMenu1(event: MouseEvent) {
    this._JarrahanGlobalService.show_content_template = true;
    if (this._JarrahanGlobalService.ads_tab === 1)
      this.ads_selectedindex = this._ContentService.articleModel.contents[this.selected_index].backups.length;

    if (this._JarrahanGlobalService.ads_tab === 4)
      this.ads_selectedindex = this._ContentService.archive_contents.length;


    else if (this._JarrahanGlobalService.ads_tab === 2)
      this.ads_selectedindex = this._ContentService.articleModel.contents[this.selected_index].contents.length;

    // this.menuout();
    this.menuOpen = !this.menuOpen;
    if (this.menuOpen) {
      const button = event.target as HTMLElement;
      const rect = button.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      this._ContentService.openUp = rect.bottom + 200 > viewportHeight;
    }
  }

  ads_isshowbtn(index: any) {
    // return this.ad_addsList[index]?.btnshow;
    return this._ContentService.articleModel.contents[index]?.btnshow;
  }

  ads_isopen(index: any) {
    // return this.ad_addsList[index]?.menuOpen;
    return this._ContentService.articleModel.contents[index]?.menuOpen;
  }

  ads_menuout() {
    this.selected_all = false;
    this.menuout();
    // this.ad_addsList.forEach(element => {
    //   element.menuOpen = false;
    // });
  }

  ads_hide_all2(item: any) {
    // console.log(item)
    // this.selected_index=null;
    if (this.overtoolbar)
      return;

    this._ContentService.articleModel.contents.forEach(element => {
      element.btnshow = false;
      element.menuOpen = false;
    });


    if (item.isAdsFull && item.contents) {
      const parent = document.querySelector('.hos' + this.selected_index);
      if (parent) {
        const contents = this._ContentService.articleModel.contents[this.selected_index]?.contents || [];

        for (let i = 0; i < contents.length; i++) {
          const valu: any = parent.querySelector('.adshos' + i + ' .ck-content');
          if (valu) {
            contents[i].content = valu.innerHTML;
          }
        }

        const findedEmpty = contents.findIndex(
          (x: { content: string | null }) =>
            x.content === '' || x.content === null || x.content === '<p><br data-cke-filler="true"></p>'
        );

        if (findedEmpty !== -1) {
          contents.splice(findedEmpty, 1);
        }
      }
    }

    else {
      const parent = document.querySelector('.hos' + this.selected_index);
      if (parent) {
        const backups = this._ContentService.articleModel.contents[this.selected_index]?.backups || [];

        for (let i = 0; i < backups.length; i++) {
          const valu: any = parent.querySelector('.adshos' + i + ' .ck-content');
          if (valu) {
            backups[i].content = valu.innerHTML;
          }
        }

        const findedEmpty = backups.findIndex(
          (x: { content: string | null }) =>
            x.content === '' || x.content === null || x.content === '<p><br data-cke-filler="true"></p>'
        );

        if (findedEmpty !== -1) {
          backups.splice(findedEmpty, 1);
        }
      }

    }


  }

  ads_hide_all() {
    // this.selected_index=null;
    if (this.overtoolbar)
      return;

    this._ContentService.articleModel.contents.forEach(element => {
      element.btnshow = false;
      element.menuOpen = false;
    });

    // this.ad_addsList.forEach(element => {
    //   element.btnshow = false;
    //   element.menuOpen = false;
    // });

    if (this._JarrahanGlobalService.ads_tab === 1) {
      for (let i = 0; i < this._ContentService.articleModel.contents[this.selected_index]?.backups.length; i++) {
        var valu: any = document.querySelector('.adshos' + i + ' .ck-content');
        if (valu)
          this._ContentService.articleModel.contents[this.selected_index].backups[i].content = valu.innerHTML;
      }

      var findedEmpty: any = this._ContentService.articleModel.contents[this.selected_index]?.backups.findIndex(
        (x: { content: string | null; }) => x.content === '' || x.content === null || x.content === '<p><br data-cke-filler="true"></p>'
      );
      if (findedEmpty !== -1)
        this._ContentService.articleModel.contents[this.selected_index]?.backups.splice(findedEmpty, 1)
    }


    else if (this._JarrahanGlobalService.ads_tab === 4) {
      for (let i = 0; i < this._ContentService.archive_contents.length; i++) {
        var valu: any = document.querySelector('.adshos' + i + ' .ck-content');
        if (valu)
          this._ContentService.archive_contents[i].content = valu.innerHTML;
      }

      var findedEmpty: any = this._ContentService.archive_contents.findIndex(
        (x: { content: string | null; }) => x.content === '' || x.content === null || x.content === '<p><br data-cke-filler="true"></p>'
      );
      if (findedEmpty !== -1)
        this._ContentService.archive_contents.splice(findedEmpty, 1)
    }


    else if (this._JarrahanGlobalService.ads_tab === 2) {
      for (let i = 0; i < this._ContentService.articleModel.contents[this.selected_index]?.contents.length; i++) {
        var valu: any = document.querySelector('.adshos' + i + ' .ck-content');
        if (valu)
          this._ContentService.articleModel.contents[this.selected_index].contents[i].content = valu.innerHTML;
      }

      var findedEmpty: any = this._ContentService.articleModel.contents[this.selected_index]?.contents.findIndex(
        (x: { content: string | null; }) => x.content === '' || x.content === null || x.content === '<p><br data-cke-filler="true"></p>'
      );
      if (findedEmpty !== -1)
        this._ContentService.articleModel.contents[this.selected_index]?.contents.splice(findedEmpty, 1)
    }
  }

  ads_hideall(index: any) {
    if (this._ContentService.articleModel.contents[index]?.menuOpen)
      return;
    // this.ad_addsList.forEach(element => {
    //   element.btnshow = false;
    // });

    this._ContentService.articleModel.contents.forEach(element => {
      element.btnshow = false;
    });

  }

  ads_showbtn(index: any) {
    // this.ad_addsList.forEach(element => {
    //   element.btnshow = false;
    // });
    this._ContentService.articleModel.contents.forEach(element => {
      element.btnshow = false;
    });
    if (this._ContentService.articleModel.contents[index])
      this._ContentService.articleModel.contents[index].btnshow = !this._ContentService.articleModel.contents[index]?.btnshow;
  }

  ads_new_content(index?: any) {
    if (index !== undefined)
      this.ads_selectedindex = index;
    this.isstatic = false;
    this.edited = false;
    this.submited = false;
    this.show_middle = true;
    this.showplus = true;
    this.title = '';
    this.content = '';
    this.menuOpen = false;
    this.ads_hide_all()
  }

  // Handle drag-and-drop reordering of items
  ads_drop(event: CdkDragDrop<any[]>) {
    const generateId = () => Date.now() + Math.floor(Math.random() * 1000);
    if (this._JarrahanGlobalService.currentDragIndex !== null) {
      const originalTemplate = this._JarrahanGlobalService.templates[this._JarrahanGlobalService.currentDragIndex];
      const item = structuredClone(originalTemplate);

      if (item.type === 'template')
        item.temid = 'template-' + generateId();


      if (item.template_type === 'button') {
        const generateId = () => Date.now() + Math.floor(Math.random() * 1000);
        item.tem_items = [
          { type: '', text: '021359874562', class: 'n', id: generateId(), active: false },
          { type: '', text: ' ثبت درخواست مشاوره', class: 'b', id: generateId(), active: false }
        ];
      }

      else if (item.template_type === 'doctor-header') {
        const generateId = () => Date.now() + Math.floor(Math.random() * 1000);
        item.tem_items = [
          { svg: this.sanitizer.bypassSecurityTrustHtml(this._JarrahanGlobalService.svgList[0].svg), text: 'اینستاگرام', class: 'social', id: generateId(), active: false, link: '' },
          { svg: this.sanitizer.bypassSecurityTrustHtml(this._JarrahanGlobalService.svgList[1].svg), text: 'تلگرام', class: 'social', id: generateId(), active: false, link: '' },
          { svg: this.sanitizer.bypassSecurityTrustHtml(this._JarrahanGlobalService.svgList[2].svg), text: 'واتساپ', class: 'social', id: generateId(), active: false, link: '' },
          { svg: this.sanitizer.bypassSecurityTrustHtml(this._JarrahanGlobalService.svgList[3].svg), text: 'توییتر', class: 'social', id: generateId(), active: false, link: '' }
        ];

      }


      else if (item.template_type === 'doctor-contact') {
        const generateId = () => Date.now() + Math.floor(Math.random() * 1000);
        item.tem_items = [
          { svg: this.sanitizer.bypassSecurityTrustHtml(this._JarrahanGlobalService.contact_svgList[0].svg), text: this._JarrahanGlobalService.contact_svgList[0].title, value: '021-87654321', id: generateId(), active: false },
          { svg: this.sanitizer.bypassSecurityTrustHtml(this._JarrahanGlobalService.contact_svgList[1].svg), text: this._JarrahanGlobalService.contact_svgList[1].title, value: '021-87654321', id: generateId(), active: false },
          { svg: this.sanitizer.bypassSecurityTrustHtml(this._JarrahanGlobalService.contact_svgList[2].svg), text: this._JarrahanGlobalService.contact_svgList[2].title, value: '09123456789', id: generateId(), active: false },
          { svg: this.sanitizer.bypassSecurityTrustHtml(this._JarrahanGlobalService.contact_svgList[3].svg), text: this._JarrahanGlobalService.contact_svgList[3].title, value: 'doctor@example.com', id: generateId(), active: false }
        ];

      }


      else if (item.template_type === 'doctor-portfolio') {
        const generateId = () => Date.now() + Math.floor(Math.random() * 1000);
        item.tem_items = [
          { img: 'https://www.drhosseinnejad.com/wp-content/uploads/sen-amal-bini.jpeg', imgalt: '', title: 'جراحی زیبایی بینی', description: 'نمونه جراحی زیبایی بینی با تکنیک پیشرفته', id: generateId(), active: false },
          { img: 'https://www.drhosseinnejad.com/wp-content/uploads/ax-bini.jpg', imgalt: '', title: 'جراحی فرم دهی بینی', description: 'اصلاح فرم بینی با حفظ تناسب چهره', id: generateId(), active: false },
          { img: 'https://www.drhosseinnejad.com/wp-content/uploads/amal-bini-1.jpg', imgalt: '', title: 'رینوپلاستی', description: 'جراحی زیبایی و عملکردی بینی', id: generateId(), active: false },
        ];
      }

      else if (item.template_type === 'doctor-comments') {
        const generateId = () => Date.now() + Math.floor(Math.random() * 1000);
        item.tem_items = [
          { img: '', title: 'مریم احمدی', description: 'نمونه جراحی زیبایی بینی با تکنیک پیشرفته', date: '۳ ماه پیش', id: generateId(), active: false, tags: ['درمان موفق', 'برخورد عالی'], rate: 5 },
          { img: '', title: 'رضا کریمی', description: 'نمونه جراحی زیبایی بینی با تکنیک پیشرفته', date: '۳ ماه پیش', id: generateId(), active: false, tags: ['درمان موفق', 'برخورد عالی'], rate: 5 },
        ];
      }


      else if (item.template_type === 'doctor-map') {
        this.lansmap_click_hint = false;
        setTimeout(() => {
          this.initMap(event.currentIndex);
        }, 10);
      }



      // جای‌گذاری item در لیست مناسب (backups یا contents)
      if (this._JarrahanGlobalService.ads_tab === 1) {
        this._ContentService.articleModel
          .contents[this._JarrahanGlobalService.selected_index]
          .backups.splice(event.currentIndex, 0, item);
      } else {
        this._ContentService.articleModel
          .contents[this._JarrahanGlobalService.selected_index]
          .contents.splice(event.currentIndex, 0, item);
      }

      // پاک‌سازی اندیس درگ‌شده
      this._JarrahanGlobalService.currentDragIndex = null;



      if (item.template_type === 'doctor-comments') {
        const wrappers = document.querySelectorAll<HTMLElement>('.reviews-wrapper');

        wrappers.forEach(wrapper => {
          wrapper.addEventListener(
            'wheel',
            function (event) {
              if (event.deltaY !== 0) {
                event.preventDefault();
                wrapper.scrollLeft += event.deltaY;
              }
            },
            { passive: false }
          );
        });
      }
    }

    else {
      // Move the item within the array based on the drag event indexes
      if (this._JarrahanGlobalService.ads_tab === 1)
        moveItemInArray(this._ContentService.articleModel.contents[this.selected_index].backups, event.previousIndex, event.currentIndex);

      if (this._JarrahanGlobalService.ads_tab === 4)
        moveItemInArray(this._ContentService.archive_contents, event.previousIndex, event.currentIndex);



      else if (this._JarrahanGlobalService.ads_tab === 2)
        moveItemInArray(this._ContentService.articleModel.contents[this.selected_index].contents, event.previousIndex, event.currentIndex);

    }


  }

  ads_moveUp(): void {
    if (this._JarrahanGlobalService.ads_tab === 1) {
      // console.log(this.selected_ads_for_move);

      if (this.selected_ads_for_move > 0) {
        const contents = this._ContentService.articleModel.contents[this.selected_index].backups;
        [contents[this.selected_ads_for_move], contents[this.selected_ads_for_move - 1]] = [contents[this.selected_ads_for_move - 1], contents[this.selected_ads_for_move]];
      }
    }
    else if (this._JarrahanGlobalService.ads_tab === 2) {
      if (this.selected_ads_for_move > 0) {
        const contents = this._ContentService.articleModel.contents[this.selected_index].contents;
        [contents[this.selected_ads_for_move], contents[this.selected_ads_for_move - 1]] = [contents[this.selected_ads_for_move - 1], contents[this.selected_ads_for_move]];
      }
    }

    this.adsshowcomm_editor = false;
    this.adsshowconfigs = false;
  }

  ads_moveDown(): void {
    if (this._JarrahanGlobalService.ads_tab === 1) {
      const contents = this._ContentService.articleModel.contents[this.selected_index].backups;
      if (this.selected_ads_for_move < contents.length - 1) {
        [contents[this.selected_ads_for_move], contents[this.selected_ads_for_move + 1]] = [contents[this.selected_ads_for_move + 1], contents[this.selected_ads_for_move]];
      }
    }

    else if (this._JarrahanGlobalService.ads_tab === 2) {
      const contents = this._ContentService.articleModel.contents[this.selected_index].contents;
      if (this.selected_ads_for_move < contents.length - 1) {
        [contents[this.selected_ads_for_move], contents[this.selected_ads_for_move + 1]] = [contents[this.selected_ads_for_move + 1], contents[this.selected_ads_for_move]];
      }
    }

    this.adsshowcomm_editor = false;
    this.adsshowconfigs = false;
  }


  current_ads_List_2(item: any) {
    // console.log(item)

    if (!item)
      return '';

    if (item.isAdsFull && item.contents) {
      return this._ContentService.articleModel.contents[this.ads_selected_index]?.contents
    }

    else {
      console.log('backups')
      return this._ContentService.articleModel.contents[this.ads_selected_index]?.backups
    }
  }


  get get_current_ads_List() {
    // console.log(item);
    var newList: any;
    if (this._JarrahanGlobalService.ads_tab === 4)
      newList = this._ContentService.archive_contents;

    else
      newList = this._JarrahanGlobalService.ads_tab === 1
        ? this._ContentService.articleModel.contents[this.ads_selected_index]?.backups
        : this._ContentService.articleModel.contents[this.ads_selected_index]?.contents;

    this._LoadingService.hide();

    return newList;

  }

  trackByFn(index: number, item: any) {
    return item.id; // یا هر ویژگی یکتای دیگه‌ای که در دیتا هست
  }


  ads_close_delete_box() {
    this.opendel_box = false;
    // Close the delete confirmation box by setting its display style to 'none'
    let el = this.delete_box?.nativeElement; // Reference the delete box element
    el.style.display = 'none'; // Hide the element
  }

  get tcurrentAdsList() {
    const newList = this._JarrahanGlobalService.ads_tab === 1
      ? this._ContentService.articleModel.contents[this.selected_index]?.backups
      : this._ContentService.articleModel.contents[this.selected_index]?.contents;

    if (JSON.stringify(newList) !== JSON.stringify(this.currentAdsList)) {
      this.showAds = false; // پنهان کردن موقت برای جلوگیری از حذف
      setTimeout(() => {
        this.currentAdsList = newList || [];
        this.showAds = true; // دوباره نمایش دادن بدون حذف ادیتورها
      }, 0);
    }

    return this.currentAdsList;
  }

  ads_confirm_del() {
    // console.log(this.ads_selected_index)
    // console.log(this.selected_index)
    // console.log(this.tcurrentAdsList)
    // console.log(this._ContentService.articleModel.contents)
    // console.log(this._ContentService.articleModel.contents[this.selected_index])

    // this.tcurrentAdsList.splice(this.ads_selected_index - 1, 1);

    if (this._JarrahanGlobalService.ads_tab === 1) {
      this._ContentService.articleModel.contents[this.selected_index]?.backups.splice(this.selected_ads, 1)
    }

    else {
      this._ContentService.articleModel.contents[this.selected_index]?.contents.splice(this.selected_ads, 1)
    }

    this.close_delete_box();
    this.showconfigs = false;
    this.showcomm_editor = false;
    this.adsshowcomm_editor = false;
    this.adsshowconfigs = false;
    this._GlobalService.showSuccess('با موفقیت حذف شد!')
  }


  onDragStarted(i: any) {
    this.dragging = true;
    this.draggingindex = i;


    // setTimeout(() => {
    //   const draggingBoxes :any = document.querySelectorAll('.dragging-box');
    //   draggingBoxes.forEach((draggingBox:HTMLElement) => {
    //     draggingBox.style.backgroundColor = '#f0f0f075';
    //   });
    // }, 1);

  }

  open_adsconfig() {
    this._ContentService.selected_content_index = this.selected_index;
    this.showcomm_editor = false;
    this.showconfigs = false;
    setTimeout(() => {
      this._ContentService.show_ads_config = true;
    }, 100);
  }

  newBlock(e: any, index: any) {
    if (e === 'content') {
      this.new_content(index);
      this.newblock_content(index);
    }
    else if (e === 'special' || e === 'list' || e === 'video') {
      this.newAds();
      this.newblock_ads(index, e)
    }

  }


  scrollTop: number = 0;
  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
  }


  showTimingContents() {
    console.log(this._ContentService.articleModel.contents)
    for (let i = 0; i < this._ContentService.articleModel.contents.length; i++) {
    }
  }

  selectedFutureIndex: number | null = null;
  public getcontentClass(item: any, index: number) {
    const now = new Date();
    const publishDate = new Date(item.publishAt);
    const isFuture = publishDate.getTime() > now.getTime();

    // اگر آیتم آینده است و انتخاب نشده، future-contents بذار
    if (isFuture && this.selectedFutureIndex !== index) {
      return 'j-moh future-contents';
    }

    // در غیر این صورت کلاس معمولی
    return 'j-moh main-contents';
  }

  fucconfirm: boolean = false;
  is_future(item: any, index: number) {
    const now = new Date(); // زمان فعلی
    const publishDate = new Date(item.publishAt); // تاریخ انتشار

    // بررسی اینکه تاریخ انتشار در آینده است یا نه
    const isFuture = publishDate.getTime() > now.getTime();

    if (isFuture && this.selectedFutureIndex !== index) {
      return true;
    }

    return false;
  }


  publishContent(item: any) {
    const currentTimestamp = Date.now();
    const tenSecondsAgoTimestamp = currentTimestamp - 10 * 1000;
    item.publishAt = tenSecondsAgoTimestamp;
  }


  template_outclick1() {
    this._JarrahanGlobalService.selected_ads_index = -1;
    this.selected_showindex = -1;
    this._ContentService.articleModel.contents.forEach((element: any) => {
      if (element.type === 'template') {
        if (element.template_type === 'doctor-header' || element.template_type === 'text')
          element.imageselected = false;
        if (element.tem_items)
          element.tem_items.forEach((element2: any) => {
            element2.active = false;
          });
      }
    });

  }

  template_outclick() {
    if (!this._JarrahanGlobalService.show_adsContent)
      this.template_outclick1()

    else {
      if (this._JarrahanGlobalService.ads_tab === 1) {
        this._ContentService.articleModel.contents[this._JarrahanGlobalService.selected_index]?.backups.forEach((element: any) => {
          if (element.type === 'template') {
            if (element.template_type === 'doctor-header' || element.template_type === 'text')
              element.imageselected = false;

            if (element.tem_items)
              element.tem_items.forEach((element2: any) => {
                element2.active = false;
              });
          }
        });
      }
      else {
        this._ContentService.articleModel.contents[this._JarrahanGlobalService.selected_index]?.contents.forEach((element: any) => {
          if (element.type === 'template') {
            if (element.template_type === 'doctor-header' || element.template_type === 'text')
              element.imageselected = false;

            if (element.tem_items)
              element.tem_items.forEach((element2: any) => {
                element2.active = false;
              });
          }
        });
      }

    }

  }

  handleClick(event: MouseEvent, item: any, i: number) {
    if (this._JarrahanGlobalService.selected_ads_index !== i) {
      this._JarrahanGlobalService.selected_ads_index = i;
    }

    this.appbuttonChange(event, 2, null);
    if (this._JarrahanGlobalService.show_adsContent)
      this.adsmoveBox(event, item, i);
    else
      this.moveBox(event, item, i);
  }

  // این تابع رو اضافه کن
  stopEvent(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();
  }

  appbuttonChange(e: MouseEvent, type: number = 0, btn: any) {
    if (btn !== null) {
      this.template_outclick()
      btn.active = true;
    }

    document.querySelectorAll<HTMLElement>('.buttonconfig')!.forEach(element => {
      element.style.display = 'block';
    });

    const clickedElement = e!.target as HTMLElement;
    const clickedElementRect = clickedElement.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const elementTop = clickedElementRect.top;
    const elementHeight = clickedElementRect.height;
    const divHeight = 10; // ارتفاع دلخواه برای div

    if (elementTop + divHeight + elementHeight > windowHeight) {
      this._ContetntService.divTop = elementTop - divHeight;
    } else {
      this._ContetntService.divTop = elementTop + elementHeight;
    }
    this._ContetntService.divLeft = clickedElementRect.left;

    this._ContetntService.hideConfigs();

    if (type === 1)
      this._ContetntService.showbuttoninlineconfigs = true;

    else if (type === 2)
      this._ContetntService.showbuttonsconfigs = true;

    else if (type === 3)
      this._ContetntService.showimageinlineconfigs = true;


    else if (type === 4) {
      this._ContetntService.showbuttoninlineconfigs = true;
      this._ContetntService.is_comment_setting = true;
    }

  }


  getInnerText(event: Event): string {
    const target = event.target as HTMLElement | null;
    return target ? target.innerText : '';
  }


  submited_address = false;
  submit_address() {
    const newSuccessMessage: any = document.querySelector('.lansmap-success-message');
    newSuccessMessage.style.display = 'block';
    setTimeout(() => {
      newSuccessMessage.style.display = 'none';
    }, 3000);
    this.searchResults = [];
    this.submited_address = true;
  }

  lat: number = 35.76;
  lng: number = 51.42;
  map!: L.Map;
  marker!: L.Marker;

  focusOnCity(result: any, mapindex: number, type = '') {
    this.submited_address = false;
    const map = this._JarrahanGlobalService.maps[mapindex]; // 👈 نقشه مربوط به این index
    if (!map) return;

    let lat: number;
    let lng: number;

    if (type === 'search') {
      lat = parseFloat(result.lat);
      lng = parseFloat(result.lon);

      if (this._JarrahanGlobalService.show_adsContent) {
        if (this._JarrahanGlobalService.ads_tab === 1) {
          this._ContentService.articleModel
            .contents[this._JarrahanGlobalService.selected_index]
            .backups[this._JarrahanGlobalService.selected_ads_index].map_address = result.display_name;
        } else {
          this._ContentService.articleModel
            .contents[this._JarrahanGlobalService.selected_index]
            .contents[this._JarrahanGlobalService.selected_ads_index].map_address = result.display_name;
        }
      }

      else {
        this._ContentService.articleModel.contents[this._JarrahanGlobalService.selected_index].map_address = result.display_name;
        this._ContentService.articleModel.contents[this._JarrahanGlobalService.selected_index].map_lat = lat;
        this._ContentService.articleModel.contents[this._JarrahanGlobalService.selected_index].map_long = lng;
      }

    } else {
      [lat, lng] = result;
    }

    if (isNaN(lat) || isNaN(lng)) {
      console.warn('مختصات نامعتبر هستند:', result);
      return;
    }

    this.lat = lat;
    this.lng = lng;

    map.setView([lat, lng], 13);

    setTimeout(() => {
      map.invalidateSize();

      // حذف مارکر قبلی
      if (this._JarrahanGlobalService.markers[mapindex]) {
        map.removeLayer(this._JarrahanGlobalService.markers[mapindex]);
      }

      // ساخت مارکر جدید برای همون نقشه
      this._JarrahanGlobalService.markers[mapindex] = L.marker([lat, lng], {
        draggable: false
      }).addTo(map);
    }, 100);

    const search_results: any = document.querySelector('.lansmap-search-results');
    search_results.style.display = 'none';
  }

  showsearch_results() {
    if (this.searchResults.length > 0) {
      const newSuccessMessage: any = document.querySelector('.lansmap-search-results');
      newSuccessMessage.style.display = 'block';
    }

  }

  private tryInitializeMaps() {
    if (this._JarrahanGlobalService.show_adsContent) {
      const newList = this._JarrahanGlobalService.ads_tab === 1
        ? this._ContentService.articleModel.contents[this.selected_index]?.backups
        : this._ContentService.articleModel.contents[this.selected_index]?.contents;
      for (let i = 0; i < newList.length; i++) {
        if (newList[i].type === 'template' && newList[i].template_type === 'doctor-map') {
          console.log(newList[i]);
          this.initMap(i, newList[i].map_lat, newList[i].map_long);
        }
      }
    }

    else {
      for (let i = 0; i < this._ContentService.articleModel.contents.length; i++) {
        if (this._ContentService.articleModel.contents[i].type === 'template' && this._ContentService.articleModel.contents[i].template_type === 'doctor-map') {
          this.initMap(i, this._ContentService.articleModel.contents[i].map_lat, this._ContentService.articleModel.contents[i].map_long); // mapId رو پاس بده نه index اشتباهی
        }
      }
    }
  }


  private initMap(index: number, mlat?: number, mlong?: number): void {
    const mapId = index + '-doctor-map';

    // اگر قبلاً map ساخته شده، دوباره نساز
    // if (this._JarrahanGlobalService.maps[index] ) return;

    console.log("initMap");

    let lat = mlat ?? this.lat;
    let lng = mlong ?? this.lng;

    const mapElement = document.getElementById(mapId);
    if (!mapElement) {
      console.warn('Map container not found:', mapId);
      return;
    }

    const map = L.map(mapId, {
      center: [lat, lng],
      zoom: 13,
      scrollWheelZoom: false
    });

    setTimeout(() => map.invalidateSize(), 0);

    this._JarrahanGlobalService.maps[index] = map;

    map.on('mouseover', () => map.scrollWheelZoom.enable());
    map.on('mouseout', () => map.scrollWheelZoom.disable());

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const marker = L.marker([lat, lng], { draggable: false }).addTo(map);
    this._JarrahanGlobalService.markers[index] = marker;

    // فرض: markers نوعش L.Marker[] هست
    map.on('click', (e: L.LeafletMouseEvent) => {
      const newLat = e.latlng.lat;
      const newLng = e.latlng.lng;

      // حذف همه مارکرهای قبلی روی این نقشه
      if (this._JarrahanGlobalService.markers[index]) {
        map.removeLayer(this._JarrahanGlobalService.markers[index]);
        // نیازی به null دادن نیست، چون همیشه مقدار جدید جایگزین میشه
      }

      // اضافه کردن مارکر جدید و ذخیره در آرایه
      const newMarker = L.marker([newLat, newLng]).addTo(map);
      this._JarrahanGlobalService.markers[index] = newMarker;

      // گرفتن آدرس
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}&accept-language=fa`)
        .then(res => res.json())
        .then(data => {
          const address = data.display_name;
          const parts = address.split(',').map((p: string) => p.trim());
          const reorderedAddress = parts.length >= 4
            ? [parts[parts.length - 3], parts[parts.length - 4], ...parts.slice(0, parts.length - 4)]
              .filter(Boolean)
              .join('، ')
            : parts.join('، ');

          if (this._JarrahanGlobalService.show_adsContent) {
            this.tcurrentAdsList[index].map_address = reorderedAddress;
            this.tcurrentAdsList[index].map_lat = newLat;
            this.tcurrentAdsList[index].map_long = newLng;
          } else {
            const content = this._ContentService.articleModel.contents[this._JarrahanGlobalService.selected_index];
            content.map_address = reorderedAddress;
            content.map_lat = newLat;
            content.map_long = newLng;
          }
        });
    });

  }




  onTitleInput(event: Event, item: any) {
    const target = event.target as HTMLElement;
    item.doc_title_new = target.innerText;
  }

  onSubtitleInput(event: Event, item: any) {
    const target = event.target as HTMLElement;
    item.doc_subtitle_new = target.innerText;
  }



  lansmap_click_hint: boolean = false;
  citysearchTerm: string = '';
  filteredCities: { title: string; key: string; coords: any }[] = [];
  cities: any[] = [
    { key: 'tehran', title: 'تهران', coords: [35.6892, 51.3890] },
    { key: 'alborz', title: 'البرز', coords: [35.8398033, 50.9799957] },
    { key: 'isfahan', title: 'اصفهان', coords: [32.6578757, 51.6731644] },
    { key: 'arzbayjan-sharghi', title: 'آذربایجان شرقی', coords: [38.0735009, 46.2938118] },
    { key: 'arzbayjan-gharbi', title: 'آذربایجان غربی', coords: [37.5482521, 45.0679779] },
    { key: 'ardabil', title: 'اردبیل', coords: [38.2489658, 48.2948685] },
    { key: 'ilam', title: 'ایلام', coords: [33.63, 46.42] },
    { key: 'bushehr', title: 'بوشهر', coords: [28.9234, 50.8203] },
    { key: 'chaharmahal', title: 'چهارمحال و بختیاری', coords: [32.32, 50.86] },
    { key: 'south-khorasan', title: 'خراسان جنوبی', coords: [32.87, 59.22] },
    { key: 'razavi-khorasan', title: 'خراسان رضوی', coords: [36.297, 59.605] },
    { key: 'north-khorasan', title: 'خراسان شمالی', coords: [37.47, 57.33] },
    { key: 'khuzestan', title: 'خوزستان', coords: [31.3183, 48.6706] },
    { key: 'zanjan', title: 'زنجان', coords: [36.6736, 48.4787] },
    { key: 'semnan', title: 'سمنان', coords: [35.57, 53.39] },
    { key: 'sistan-baluchestan', title: 'سیستان و بلوچستان', coords: [29.4963, 60.8629] },
    { key: 'fars', title: 'فارس', coords: [29.5926, 52.5836] },
    { key: 'qazvin', title: 'قزوین', coords: [36.27, 49.99] },
    { key: 'qom', title: 'قم', coords: [34.6416, 50.8746] },
    { key: 'kurdistan', title: 'کردستان', coords: [35.3219, 46.9862] },
    { key: 'kerman', title: 'کرمان', coords: [30.2839, 57.0834] },
    { key: 'kermanshah', title: 'کرمانشاه', coords: [34.3142, 47.0650] },
    { key: 'kohgiluyeh', title: 'کهگیلویه و بویراحمد', coords: [30.68, 51.6] },
    { key: 'golestan', title: 'گلستان', coords: [36.84, 54.43] },
    { key: 'gilan', title: 'گیلان', coords: [37.2809, 49.5924] },
    { key: 'lorestan', title: 'لرستان', coords: [33.47, 48.35] },
    { key: 'mazandaran', title: 'مازندران', coords: [36.5658, 53.0586] },
    { key: 'markazi', title: 'مرکزی', coords: [34.0954, 49.7013] },
    { key: 'hormozgan', title: 'هرمزگان', coords: [27.1832, 56.2666] },
    { key: 'hamedan', title: 'همدان', coords: [34.7983, 48.5148] },
    { key: 'yazd', title: 'یزد', coords: [31.8974, 54.3569] }
  ];
  filterCities(): void {
    const term = this.citysearchTerm.toLowerCase();
    this.filteredCities = this.cities.filter(city =>
      city.title.toLowerCase().includes(term)
    );
  }


  searchQuery: string = '';
  typingTimer: any = null;
  searchResults: any[] = [];
  onSearchInput(item: any, event: any): void {
    const value = event.target.value;
    this.searchQuery = value;

    // اگر تایمر قبلی بود پاکش کن
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }

    // شروع تایمر جدید
    this.typingTimer = setTimeout(() => {
      this.searchLocation(item);
    }, 500); // بعد از 500 میلی‌ثانیه جستجو کن
  }
  searchLocation(item: any): void {
    if (!this.searchQuery.trim()) return;

    const lat = this.lat;  // یا مرکز نقشه شما
    const lng = this.lng;

    let queryWithLocation = this.searchQuery;
    if (item.selected_city) {
      queryWithLocation += `, ${item.selected_city}`;
    }
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      queryWithLocation
    )}&format=json&addressdetails=1&accept-language=fa`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        this.searchResults = data;
        if (this.searchResults.length > 0) {
          const newSuccessMessage: any = document.querySelector('.lansmap-search-results');
          newSuccessMessage.style.display = 'block';
        }

        else {
          const newSuccessMessage: any = document.querySelector('.lansmap-search-results');
          newSuccessMessage.style.display = 'none';
        }
      })
      .catch((error) => {
        console.error('خطا در دریافت داده‌ها:', error);
      });
  }


  template_editorInstances: Array<{ [field: string]: EditorObj }> = [];
  enableEditor2(item: any, index: number, field: 'title' | 'subtitle') {
    this.template_editorInstances[index] = this.template_editorInstances[index] || {};
    this.template_editorInstances[index][field] =
      this.template_editorInstances[index][field] || { instance: null, isOpen: true };
    this.template_editorInstances[index][field].isOpen = true;

    setTimeout(() => {
      const editorInstance = this.template_editorInstances[index][field].instance;
      if (editorInstance) {
        editorInstance.editing.view.focus();

        const selection = editorInstance.model.document.selection;
        const model = editorInstance.model;

        // فقط اگه هیچ سلکشن فعالی وجود نداشت، کرسر رو ببر آخر
        if (selection && selection.isCollapsed && !selection.anchor) {
          model.change((writer: any) => {
            const endPos = model.createPositionAt(model.document.getRoot(), 'end');
            writer.setSelection(endPos);
          });
        }
      }
    }, 0);

    // لیسنر برای بستن ادیتور با کلیک بیرون
    setTimeout(() => {
      const handler = (ev: MouseEvent) => {
        const target = ev.target as HTMLElement;
        // اگر کلیک داخل ادیتور یا ابزارها بود → نبند
        if (target.closest('.ck')) return;

        const editorObj = this.template_editorInstances[index]?.[field];
        if (editorObj && editorObj.isOpen) {
          this.closeEditor(index, item, field);
        }

        document.removeEventListener('mousedown', handler);
      };
      document.addEventListener('mousedown', handler);
    }, 0);
  }
  onEditorReady(editorInstance: any, index: number, field: 'title' | 'subtitle') {
    this.template_editorInstances[index] = this.template_editorInstances[index] || {};
    this.template_editorInstances[index][field] = { instance: editorInstance, isOpen: true };
  }
  closeEditor(index: number, item: any, field: 'title' | 'subtitle') {
    const editorObj = this.template_editorInstances[index]?.[field];
    if (!editorObj) return;

    if (field === 'title') {
      item.doc_title = editorObj.instance.getData();
    } else {
      item.doc_subtitle = editorObj.instance.getData();
    }
    editorObj.isOpen = false;


    setTimeout(() => {
      this.mixContent();
    }, 1000);
  }



  // ads
  ads_template_editorInstances: Array<{ [field: string]: EditorObj }> = [];
  ads_enableEditor2(item: any, index: number, field: 'title' | 'subtitle') {
    this.ads_template_editorInstances[index] = this.ads_template_editorInstances[index] || {};
    this.ads_template_editorInstances[index][field] =
      this.ads_template_editorInstances[index][field] || { instance: null, isOpen: true };
    this.ads_template_editorInstances[index][field].isOpen = true;

    setTimeout(() => {
      const editorInstance = this.ads_template_editorInstances[index][field].instance;
      if (editorInstance) {
        editorInstance.editing.view.focus();

        const selection = editorInstance.model.document.selection;
        const model = editorInstance.model;

        // فقط اگه هیچ سلکشن فعالی وجود نداشت، کرسر رو ببر آخر
        if (selection && selection.isCollapsed && !selection.anchor) {
          model.change((writer: any) => {
            const endPos = model.createPositionAt(model.document.getRoot(), 'end');
            writer.setSelection(endPos);
          });
        }
      }
    }, 0);

    // لیسنر برای بستن ادیتور با کلیک بیرون
    setTimeout(() => {
      const handler = (ev: MouseEvent) => {
        const target = ev.target as HTMLElement;
        // اگر کلیک داخل ادیتور یا ابزارها بود → نبند
        if (target.closest('.ck')) return;

        const editorObj = this.ads_template_editorInstances[index]?.[field];
        if (editorObj && editorObj.isOpen) {
          this.ads_closeEditor(index, item, field);
        }

        document.removeEventListener('mousedown', handler);
      };
      document.addEventListener('mousedown', handler);
    }, 0);
  }


  ads_onEditorReady(editorInstance: any, index: number, field: 'title' | 'subtitle') {
    this.ads_template_editorInstances[index] = this.ads_template_editorInstances[index] || {};
    this.ads_template_editorInstances[index][field] = { instance: editorInstance, isOpen: true };
  }
  ads_closeEditor(index: number, item: any, field: 'title' | 'subtitle') {
    const editorObj = this.ads_template_editorInstances[index]?.[field];
    if (!editorObj) return;

    if (field === 'title') {
      item.doc_title = editorObj.instance.getData();
    } else {
      item.doc_subtitle = editorObj.instance.getData();
    }
    editorObj.isOpen = false;


    setTimeout(() => {
      this.mixContent();
    }, 1000);

  }


  sanitize(svg: any) {
    if (!svg && svg !== '') return '';
    // اگر به هر دلیلی یک شیء SafeValue یا شیء دیگر است، آن را به رشته تبدیل کن
    if (typeof svg === 'object' && 'changingThisBreaksApplicationSecurity' in svg) {
      svg = svg.changingThisBreaksApplicationSecurity;
    }
    return this.sanitizer.bypassSecurityTrustHtml(String(svg));
  }
}