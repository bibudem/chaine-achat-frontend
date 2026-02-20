import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsagerFormulaireComponent } from './usager-formulaire.component';

describe('UsagerFormulaireComponent', () => {
  let component: UsagerFormulaireComponent;
  let fixture: ComponentFixture<UsagerFormulaireComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UsagerFormulaireComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsagerFormulaireComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
