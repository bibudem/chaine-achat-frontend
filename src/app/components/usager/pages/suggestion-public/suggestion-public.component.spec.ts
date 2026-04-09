import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuggestionPublicComponent } from './suggestion-public.component';

describe('SuggestionPublicComponent', () => {
  let component: SuggestionPublicComponent;
  let fixture: ComponentFixture<SuggestionPublicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuggestionPublicComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuggestionPublicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
