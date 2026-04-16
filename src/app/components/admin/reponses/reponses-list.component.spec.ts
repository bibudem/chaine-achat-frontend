import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReponsesListComponent } from './reponses-list.component';

describe('ReponsesListComponent', () => {
  let component: ReponsesListComponent;
  let fixture: ComponentFixture<ReponsesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReponsesListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReponsesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
