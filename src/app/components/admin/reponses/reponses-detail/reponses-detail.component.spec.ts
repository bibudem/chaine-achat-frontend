import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReponsesDetailComponent } from './reponses-detail.component';

describe('ReponsesDetailComponent', () => {
  let component: ReponsesDetailComponent;
  let fixture: ComponentFixture<ReponsesDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReponsesDetailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReponsesDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
