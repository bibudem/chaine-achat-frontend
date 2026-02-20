import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsagerHomeComponent } from './usager-home.component';

describe('UsagerHomeComponent', () => {
  let component: UsagerHomeComponent;
  let fixture: ComponentFixture<UsagerHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UsagerHomeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsagerHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
