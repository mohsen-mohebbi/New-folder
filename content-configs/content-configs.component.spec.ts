import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentConfigsComponent } from './content-configs.component';

describe('ContentConfigsComponent', () => {
  let component: ContentConfigsComponent;
  let fixture: ComponentFixture<ContentConfigsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentConfigsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ContentConfigsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
