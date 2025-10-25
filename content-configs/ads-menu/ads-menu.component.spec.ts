import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdsMenuComponent } from './ads-menu.component';

describe('AdsMenuComponent', () => {
  let component: AdsMenuComponent;
  let fixture: ComponentFixture<AdsMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdsMenuComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdsMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
