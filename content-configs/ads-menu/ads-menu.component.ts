import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentService } from '../../../services/content.service';

@Component({
  selector: 'app-ads-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ads-menu.component.html',
  styleUrl: './ads-menu.component.scss'
})
export class AdsMenuComponent {
  @Input() index: any;
  @Output() emiter = new EventEmitter<any>();
  constructor(
    public _ContentService: ContentService,
  ) {
  }
  isshowbtn(index: any) {
    return this._ContentService.articleModel.contents[index]?.btnshow;
  }


  toggleMenu(event: MouseEvent, index: any) {
    console.log("sadsa");
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

  isopen(index: any) {
    return this._ContentService.articleModel.contents[index]?.menuOpen;
  }

  menuout() {
    this._ContentService.articleModel.contents.forEach(element => {
      element.menuOpen = false;
    });
  }

  newads(type:string) {
    this.emiter.emit(type)
  }

  newcontent() {
    this.emiter.emit('content')
  }

}
