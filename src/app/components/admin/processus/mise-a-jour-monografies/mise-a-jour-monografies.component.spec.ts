import { ComponentFixture, TestBed } from '@angular/core/testing';

import {MiseAjourMonographieComponent} from "./mise-a-jour-monografies.component";

describe('MiseAjourMonographieComponent', () => {
  let component: MiseAjourMonographieComponent;
  let fixture: ComponentFixture<MiseAjourMonographieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MiseAjourMonographieComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MiseAjourMonographieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
