import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArchiveAdsComponent } from './archive-ads.component';

describe('ArchiveAdsComponent', () => {
  let component: ArchiveAdsComponent;
  let fixture: ComponentFixture<ArchiveAdsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchiveAdsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ArchiveAdsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
