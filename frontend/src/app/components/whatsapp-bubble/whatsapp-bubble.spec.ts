import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhatsappBubble } from './whatsapp-bubble';

describe('WhatsappBubble', () => {
  let component: WhatsappBubble;
  let fixture: ComponentFixture<WhatsappBubble>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhatsappBubble]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WhatsappBubble);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
