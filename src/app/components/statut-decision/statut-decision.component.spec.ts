import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { StatutDecisionComponent } from './statut-decision.component';
import { DialogService } from '../../services/dialog.service';

describe('StatutDecisionComponent', () => {
  let component: StatutDecisionComponent;
  let fixture: ComponentFixture<StatutDecisionComponent>;
  let mockActivatedRoute: any;
  let mockDialogService: any;

  beforeEach(async () => {
    mockActivatedRoute = {
      snapshot: {
        queryParamMap: {
          get: jasmine.createSpy('get').and.returnValue('123')
        }
      }
    };

    mockDialogService = {
      showError: jasmine.createSpy('showError')
    };

    await TestBed.configureTestingModule({
      declarations: [StatutDecisionComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: DialogService, useValue: mockDialogService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StatutDecisionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.form.get('statut_bibliotheque')?.value).toBe('');
    expect(component.form.get('note_commentaire')?.value).toBe('');
  });

  it('should mark statut_bibliotheque as required', () => {
    const control = component.form.get('statut_bibliotheque');
    control?.setValue('');
    expect(control?.hasError('required')).toBeTruthy();
  });

  it('should allow note_commentaire to be optional', () => {
    const control = component.form.get('note_commentaire');
    control?.setValue('');
    expect(control?.valid).toBeTruthy();
  });
});
