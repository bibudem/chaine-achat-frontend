import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { AcqDecisionComponent } from './acq-decision.component';
import { DialogService } from '../../services/dialog.service';

describe('AcqDecisionComponent', () => {
  let component: AcqDecisionComponent;
  let fixture: ComponentFixture<AcqDecisionComponent>;
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
      declarations: [AcqDecisionComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: DialogService, useValue: mockDialogService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AcqDecisionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.form.get('suivi_acq')?.value).toBe('');
    expect(component.form.get('note_acq')?.value).toBe('');
  });

  it('should mark suivi_acq as required', () => {
    const control = component.form.get('suivi_acq');
    control?.setValue('');
    expect(control?.hasError('required')).toBeTruthy();
  });

  it('should allow note_acq to be optional', () => {
    const control = component.form.get('note_acq');
    control?.setValue('');
    expect(control?.valid).toBeTruthy();
  });
});
